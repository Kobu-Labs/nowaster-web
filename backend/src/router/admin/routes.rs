use axum::{
    body::Body,
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::Response,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::instrument;

use crate::{
    dto::{db_backup::ReadDbBackupDto, user::read_user::ReadUserDto},
    router::{admin::{AdminUser, release::admin_release_router}, response::ApiResponse, root::AppState},
};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImpersonationResponse {
    impersonation_token: String,
    target_user_id: String,
}

#[derive(Debug, Deserialize)]
pub struct StopImpersonationRequest {
    impersonation_token: String,
}

#[derive(Debug, Deserialize)]
pub struct SearchUsersQuery {
    q: String,
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_limit() -> i64 {
    10
}

pub fn admin_router() -> Router<AppState> {
    Router::new()
        .route("/users/search", get(search_users))
        .route("/users/{user_id}", get(get_user_by_id))
        .route("/impersonate/{user_id}", post(start_impersonation))
        .route("/stop-impersonation", post(stop_impersonation))
        .route("/backups", get(get_backups))
        .route("/backups/{backup_id}/download", get(download_backup))
        .route("/sandbox/lifecycles", get(get_sandbox_lifecycles))
        .route("/sandbox/reset", post(reset_sandbox_handler))
        .nest("/releases", admin_release_router())
}

#[instrument(skip(state))]
async fn search_users(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Query(query): Query<SearchUsersQuery>,
) -> Result<Json<ApiResponse<Vec<ReadUserDto>>>, StatusCode> {
    if query.q.is_empty() {
        return Ok(Json(ApiResponse::Success { data: vec![] }));
    }

    let users = state
        .user_service
        .search_users(&query.q, query.limit)
        .await
        .map_err(|e| {
            tracing::error!("Failed to search users: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: users }))
}

#[instrument(skip(state))]
async fn get_user_by_id(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(user_id): Path<String>,
) -> Result<Json<ApiResponse<ReadUserDto>>, StatusCode> {
    let user = state
        .user_service
        .get_user_by_id(user_id.clone())
        .await
        .map_err(|e| {
            tracing::error!("Failed to get user {}: {}", user_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    match user {
        Some(user) => Ok(Json(ApiResponse::Success { data: user })),
        None => Err(StatusCode::NOT_FOUND),
    }
}

#[instrument(skip(state))]
async fn start_impersonation(
    State(state): State<AppState>,
    AdminUser(admin): AdminUser,
    Path(target_user_id): Path<String>,
) -> Result<Json<ApiResponse<ImpersonationResponse>>, StatusCode> {
    if admin.user_id == target_user_id {
        return Err(StatusCode::BAD_REQUEST);
    }

    let target_actor = state
        .user_service
        .get_actor_by_id(target_user_id.clone())
        .await
        .map_err(|e| {
            tracing::error!("Failed to get target user: {}", e);
            StatusCode::NOT_FOUND
        })?;

    if let Some((actor, _)) = target_actor {
        if actor.is_admin() {
            tracing::warn!("Attempted to impersonate admin user: {}", target_user_id);
            return Err(StatusCode::FORBIDDEN);
        }
    } else {
        return Err(StatusCode::NOT_FOUND);
    }

    let impersonation_token = state
        .auth_service
        .start_impersonation(&admin.user_id, &target_user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to start impersonation: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let response = ImpersonationResponse {
        impersonation_token,
        target_user_id,
    };

    Ok(Json(ApiResponse::Success { data: response }))
}

#[instrument(skip(state))]
async fn stop_impersonation(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Json(req): Json<StopImpersonationRequest>,
) -> Result<StatusCode, StatusCode> {
    state
        .auth_service
        .stop_impersonation(&req.impersonation_token)
        .await
        .map_err(|e| {
            tracing::error!("Failed to stop impersonation: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(StatusCode::NO_CONTENT)
}

#[instrument(skip(state))]
async fn get_backups(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
) -> Result<Json<ApiResponse<Vec<ReadDbBackupDto>>>, StatusCode> {
    let backups = state
        .db_backup_repo
        .get_all()
        .await
        .map_err(|e| {
            tracing::error!("Failed to get backups: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let backups_dto: Vec<ReadDbBackupDto> = backups.into_iter().map(ReadDbBackupDto::from).collect();

    Ok(Json(ApiResponse::Success { data: backups_dto }))
}

#[instrument(skip(state))]
async fn download_backup(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(backup_id): Path<i32>,
) -> Result<Response, StatusCode> {
    // Get backup record
    let backup = state
        .db_backup_repo
        .get_by_id(backup_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get backup {}: {}", backup_id, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let backup = backup.ok_or(StatusCode::NOT_FOUND)?;

    // Get file from S3
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

    // Convert ByteStream to bytes
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

#[derive(Debug, Deserialize)]
struct ResetSandboxRequest {
    secret: String,
}

#[instrument(skip(state))]
async fn reset_sandbox_handler(
    State(state): State<AppState>,
    Json(req): Json<ResetSandboxRequest>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    if state.config.server.app_env != crate::config::env::AppEnvironment::NowasterSandbox {
        tracing::warn!("Sandbox reset called in non-sandbox environment");
        return Err(StatusCode::FORBIDDEN);
    }

    let expected_secret = std::env::var("SANDBOX_RESET_SECRET")
        .unwrap_or_else(|_| "change-me-in-production".to_string());

    if req.secret != expected_secret {
        tracing::warn!("Sandbox reset attempted with invalid secret");
        return Err(StatusCode::UNAUTHORIZED);
    }

    state
        .sandbox_service
        .teardown_active_lifecycle("recycled", "system", "automatic")
        .await
        .map_err(|e| {
            tracing::error!("Failed to teardown lifecycle: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    state
        .sandbox_service
        .reset_sandbox()
        .await
        .map_err(|e| {
            tracing::error!("Failed to reset sandbox: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    state
        .sandbox_service
        .create_lifecycle("system", "automatic")
        .await
        .map_err(|e| {
            tracing::error!("Failed to create lifecycle: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    state
        .sandbox_service
        .reinitialize_guest_pool()
        .await
        .map_err(|e| {
            tracing::error!("Failed to reinitialize guest pool: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Reload guest pool in memory
    state
        .sandbox_service
        .init_pool()
        .await
        .map_err(|e| {
            tracing::error!("Failed to reload guest pool: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!("✅ Sandbox reset complete");

    Ok(Json(ApiResponse::Success {
        data: "Sandbox reset successful".to_string(),
    }))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SandboxLifecycleResponse {
    id: i32,
    status: String,
    created_by: String,
    created_type: String,
    torndown_by: Option<String>,
    torndown_type: Option<String>,
    unique_users: i32,
    started_at: DateTime<Utc>,
    ended_at: Option<DateTime<Utc>>,
    duration_hours: Option<f64>,
}

#[instrument(skip(state, _admin))]
async fn get_sandbox_lifecycles(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<ApiResponse<Vec<SandboxLifecycleResponse>>>, StatusCode> {
    let lifecycles = state.sandbox_service.get_all_lifecycles(100).await.map_err(|e| {
        tracing::error!("Failed to get sandbox lifecycles: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let response: Vec<SandboxLifecycleResponse> = lifecycles
        .into_iter()
        .map(|l| {
            let duration = l.duration_hours();
            SandboxLifecycleResponse {
                id: l.id,
                status: l.status,
                created_by: l.created_by,
                created_type: l.created_type,
                torndown_by: l.torndown_by,
                torndown_type: l.torndown_type,
                unique_users: l.unique_users,
                started_at: l.started_at,
                ended_at: l.ended_at,
                duration_hours: duration,
            }
        })
        .collect();

    Ok(Json(ApiResponse::Success { data: response }))
}
