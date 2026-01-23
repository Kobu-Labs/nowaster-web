use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tracing::instrument;

use crate::router::{admin::AdminUser, response::ApiResponse, root::AppState};

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

pub fn admin_impersonation_router() -> Router<AppState> {
    Router::new()
        .route("/{user_id}", post(start_impersonation))
        .route("/stop", post(stop_impersonation))
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
