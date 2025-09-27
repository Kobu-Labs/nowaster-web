use axum::extract::Path;
use axum::routing::{delete, get};
use axum::{extract::State, routing::post, Router};
use thiserror::Error;
use tracing::instrument;
use uuid::Uuid;

use crate::dto::session::filter_session::FilterSessionDto;
use crate::dto::session::fixed_session::{
    CreateFixedSessionDto, ReadFixedSessionDto, UpdateFixedSessionDto,
};
use crate::dto::session::grouped_session::GroupSessionsDto;
use crate::router::clerk::Actor;
use crate::router::request::ValidatedRequest;
use crate::router::response::ApiResponse;
use crate::router::root::AppState;
use crate::service::session::fixed::ActiveSession;
use crate::repository::fixed_session::GroupedResult;

pub fn fixed_session_router() -> Router<AppState> {
    Router::new()
        .route("/active", get(active_session_handler))
        .route("/", post(create_handler).patch(update_handler))
        .route("/{session_id}", delete(delete_handler))
        .route("/filter", post(filter_handler))
        .route("/group", post(group_handler))
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn create_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateFixedSessionDto>,
) -> ApiResponse<ReadFixedSessionDto> {
    let res = state
        .session_service
        .create_fixed_session(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn active_session_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ActiveSession>> {
    let res = state.session_service.get_active_sessions(actor).await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor, session_id = %session_id))]
async fn delete_handler(
    State(state): State<AppState>,
    actor: Actor,
    Path(session_id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state
        .session_service
        .delete_session(session_id, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn filter_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<FilterSessionDto>,
) -> ApiResponse<Vec<ReadFixedSessionDto>> {
    let res = state
        .session_service
        .filter_fixed_sessions(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn update_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateFixedSessionDto>,
) -> ApiResponse<ReadFixedSessionDto> {
    let res = state
        .session_service
        .update_fixed_session(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn group_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<GroupSessionsDto>,
) -> ApiResponse<Vec<GroupedResult>> {
    let res = state
        .session_service
        .group_sessions(payload.filter, payload.grouping, payload.aggregating, actor)
        .await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum SessionError {
    #[error("Something went wrong")]
    UnknownError,
}
