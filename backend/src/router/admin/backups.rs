use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, StatusCode},
    response::Response,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use tracing::instrument;

use crate::{
    dto::db_backup::ReadDbBackupDto,
    router::{admin::AdminUser, response::ApiResponse, root::AppState},
};

pub fn admin_backups_router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_backups))
        .route("/{backup_id}/download", get(download_backup))
        .route("/{backup_id}/notify", post(notify_backup_result))
}

#[derive(Debug, Deserialize)]
struct NotifyBackupRequest {
    secret: String,
}

#[instrument(skip(state))]
async fn get_backups(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
) -> Result<Json<ApiResponse<Vec<ReadDbBackupDto>>>, StatusCode> {
    let backups = state.db_backup_repo.get_all().await.map_err(|e| {
        tracing::error!("Failed to get backups: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let backups_dto: Vec<ReadDbBackupDto> =
        backups.into_iter().map(ReadDbBackupDto::from).collect();

    Ok(Json(ApiResponse::Success { data: backups_dto }))
}

#[instrument(skip(state))]
async fn download_backup(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(backup_id): Path<i32>,
) -> Result<Response, StatusCode> {
    let backup = state
        .db_backup_repo
        .get_by_id(backup_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get backup {}: {}", backup_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let backup = backup.ok_or(StatusCode::NOT_FOUND)?;

    let bucket = &state.config.s3.bucket_name;
    let key = &backup.backup_file;

    let object = state
        .s3_client
        .get_object()
        .bucket(bucket)
        .key(key)
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to get backup file from S3: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let bytes = object
        .body
        .collect()
        .await
        .map_err(|e| {
            tracing::error!("Failed to read backup file bytes: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .into_bytes();

    let filename = key.split('/').next_back().unwrap_or("backup.dump");

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/octet-stream")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", filename),
        )
        .body(Body::from(bytes))
        .unwrap())
}

#[instrument(skip(state))]
async fn notify_backup_result(
    State(state): State<AppState>,
    Path(backup_id): Path<i32>,
    Json(req): Json<NotifyBackupRequest>,
) -> ApiResponse<()> {
    let expected_secret =
        std::env::var("BACKUP_NOTIFY_SECRET").unwrap_or_else(|_| "placeholder".into());
    if req.secret != expected_secret {
        return ApiResponse::Error {
            message: "Invalid secret".to_string(),
        };
    }

    let backup = match state.db_backup_repo.get_by_id(backup_id).await {
        Ok(Some(b)) => b,
        Ok(None) => {
            return ApiResponse::Error {
                message: format!("Backup {} not found", backup_id),
            }
        }
        Err(e) => {
            tracing::error!("Failed to fetch backup {}: {}", backup_id, e);
            return ApiResponse::Error {
                message: "Failed to fetch backup".to_string(),
            };
        }
    };

    let result = match backup.status.as_str() {
        "success" => {
            state
                .notification_service
                .notify_admins_backup_completed(
                    backup.id,
                    backup.backup_size_bytes,
                    backup.duration_seconds,
                    backup.started_at,
                )
                .await
        }
        "failed" => {
            state
                .notification_service
                .notify_admins_backup_failed(
                    backup.id,
                    backup.error_message,
                    backup.duration_seconds,
                    backup.started_at,
                )
                .await
        }
        status => {
            return ApiResponse::Error {
                message: format!("Backup status '{}' is not notifiable", status),
            };
        }
    };

    if let Err(e) = result {
        tracing::error!("Failed to send backup notifications for {}: {}", backup_id, e);
        return ApiResponse::Error {
            message: "Failed to send notifications".to_string(),
        };
    }

    ApiResponse::Success { data: () }
}
