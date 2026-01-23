use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, StatusCode},
    response::Response,
    routing::get,
    Json, Router,
};
use tracing::instrument;

use crate::{
    dto::db_backup::ReadDbBackupDto,
    router::{admin::AdminUser, response::ApiResponse, root::AppState},
};

pub fn admin_backups_router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_backups))
        .route("/{backup_id}/download", get(download_backup))
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
