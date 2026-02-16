use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use tracing::instrument;

use crate::{
    dto::user::read_user::ReadUserDto,
    router::{admin::AdminUser, response::ApiResponse, root::AppState},
};

#[derive(Debug, Deserialize)]
pub struct SearchUsersQuery {
    q: String,
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_limit() -> i64 {
    10
}

pub fn admin_users_router() -> Router<AppState> {
    Router::new()
        .route("/search", get(search_users))
        .route("/{user_id}", get(get_user_by_id))
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
