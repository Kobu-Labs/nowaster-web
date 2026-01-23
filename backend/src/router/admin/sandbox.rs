use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::instrument;

use crate::{
    entity::sandbox_lifecycle::SandboxStatus,
    router::{admin::AdminUser, response::ApiResponse, root::AppState},
};

#[derive(Debug, Deserialize)]
struct ResetSandboxRequest {
    secret: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SandboxLifecycleResponse {
    sandbox_lifecycle_id: i32,
    status: String,
    created_by: String,
    created_type: String,
    torndown_by: Option<String>,
    torndown_type: Option<String>,
    unique_users: i32,
    started_at: DateTime<Utc>,
    ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SandboxResetResponse {
    old: SandboxLifecycleResponse,
    new: SandboxLifecycleResponse,
}

pub fn admin_sandbox_router() -> Router<AppState> {
    Router::new()
        .route("/lifecycles", get(get_sandbox_lifecycles))
        .route("/reset", post(reset_sandbox_handler))
}

#[instrument(skip(state))]
async fn reset_sandbox_handler(
    State(state): State<AppState>,
    Json(req): Json<ResetSandboxRequest>,
) -> Result<Json<ApiResponse<SandboxResetResponse>>, StatusCode> {
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

    let old_lifecycle = state
        .sandbox_service
        .get_active_lifecycle()
        .await
        .map_err(|e| {
            tracing::error!("Failed to get active lifecycle: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or_else(|| {
            tracing::error!("No active lifecycle found");
            StatusCode::NOT_FOUND
        })?;

    state
        .sandbox_service
        .teardown_active_lifecycle(SandboxStatus::Recycled, "system", "automatic")
        .await
        .map_err(|e| {
            tracing::error!("Failed to teardown lifecycle: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    state.sandbox_service.reset_sandbox().await.map_err(|e| {
        tracing::error!("Failed to reset sandbox: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let new_lifecycle = state
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

    state.sandbox_service.init_pool().await.map_err(|e| {
        tracing::error!("Failed to reload guest pool: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tracing::info!("✅ Sandbox reset complete");

    let response = SandboxResetResponse {
        old: SandboxLifecycleResponse {
            sandbox_lifecycle_id: old_lifecycle.id,
            status: old_lifecycle.status,
            created_by: old_lifecycle.created_by,
            created_type: old_lifecycle.created_type,
            torndown_by: old_lifecycle.torndown_by,
            torndown_type: old_lifecycle.torndown_type,
            unique_users: old_lifecycle.unique_users,
            started_at: old_lifecycle.started_at,
            ended_at: old_lifecycle.ended_at,
        },
        new: SandboxLifecycleResponse {
            sandbox_lifecycle_id: new_lifecycle.id,
            status: new_lifecycle.status,
            created_by: new_lifecycle.created_by,
            created_type: new_lifecycle.created_type,
            torndown_by: new_lifecycle.torndown_by,
            torndown_type: new_lifecycle.torndown_type,
            unique_users: new_lifecycle.unique_users,
            started_at: new_lifecycle.started_at,
            ended_at: new_lifecycle.ended_at,
        },
    };

    Ok(Json(ApiResponse::Success { data: response }))
}

#[instrument(skip(state, _admin))]
async fn get_sandbox_lifecycles(
    State(state): State<AppState>,
    _admin: AdminUser,
) -> Result<Json<ApiResponse<Vec<SandboxLifecycleResponse>>>, StatusCode> {
    let lifecycles = state
        .sandbox_service
        .get_all_lifecycles(100)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get sandbox lifecycles: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let response: Vec<SandboxLifecycleResponse> = lifecycles
        .into_iter()
        .map(|l| SandboxLifecycleResponse {
            sandbox_lifecycle_id: l.id,
            status: l.status,
            created_by: l.created_by,
            created_type: l.created_type,
            torndown_by: l.torndown_by,
            torndown_type: l.torndown_type,
            unique_users: l.unique_users,
            started_at: l.started_at,
            ended_at: l.ended_at,
        })
        .collect();

    Ok(Json(ApiResponse::Success { data: response }))
}
