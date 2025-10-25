use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tracing::instrument;

use crate::{
    dto::user::read_user::ReadUserDto,
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
