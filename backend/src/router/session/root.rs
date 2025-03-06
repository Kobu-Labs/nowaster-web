use axum::extract::Path;
use axum::routing::{delete, get};
use axum::{extract::State, routing::post, Router};
use thiserror::Error;
use uuid::Uuid;

use crate::dto::session::filter_session::FilterSessionDto;
use crate::dto::session::fixed_session::{CreateFixedSessionDto, ReadFixedSessionDto};
use crate::router::request::ValidatedRequest;
use crate::router::response::ApiResponse;
use crate::router::root::AppState;

pub fn session_router() -> Router<AppState> {
    Router::new()
        .route("/active", get(active_session_handler))
        .route("/", post(create_handler))
        .route("/{session_id}", delete(delete_handler))
        .route("/filter", post(filter_handler))
}

async fn create_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<CreateFixedSessionDto>,
) -> ApiResponse<ReadFixedSessionDto> {
    let res = state.session_service.create_fixed_session(payload).await;
    ApiResponse::from_result(res)
}

async fn active_session_handler(
    State(state): State<AppState>,
) -> ApiResponse<Vec<ReadFixedSessionDto>> {
    let res = state.session_service.get_active_sessions().await;
    ApiResponse::from_result(res)
}

async fn delete_handler(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state.session_service.delete_session(session_id).await;
    ApiResponse::from_result(res)
}

async fn filter_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<FilterSessionDto>,
) -> ApiResponse<Vec<ReadFixedSessionDto>> {
    let res = state.session_service.filter_fixed_sessions(payload).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum SessionError {
    #[error("Something went wrong")]
    UnknownError,
}
