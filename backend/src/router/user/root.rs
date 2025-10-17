use crate::dto::user::read_user::ReadUserDto;
use crate::dto::user::update_user::UpdateUserDto;
use crate::dto::user::update_visibility::{UpdateVisibilityDto, UpdateVisibilitySettingsDto};
use crate::router::clerk::Actor;
use crate::router::request::ValidatedRequest;
use crate::router::response::ApiResponse;
use crate::router::root::AppState;
use axum::routing::patch;
use axum::{extract::State, Router};
use thiserror::Error;
use tracing::instrument;

pub fn protected_user_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            patch(update_user_handler).get(get_current_user_handler),
        )
        .route("/visibility", patch(update_visibility_handler))
}

#[instrument(skip(state))]
async fn update_user_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateUserDto>,
) -> ApiResponse<ReadUserDto> {
    let res = state.user_service.update_user(payload).await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn get_current_user_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<ReadUserDto> {
    let res = match state.user_service.get_user_by_id(actor.user_id).await {
        Ok(Some(user)) => Ok(user),
        Ok(None) => Err(UserError::UserNotFound),
        Err(e) => Err(e),
    };
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn update_visibility_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateVisibilitySettingsDto>,
) -> ApiResponse<ReadUserDto> {
    let visibility_dto: UpdateVisibilityDto = payload.into();
    let res = state
        .user_service
        .update_visibility(actor.user_id, visibility_dto)
        .await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum UserError {
    #[error("User not found")]
    UserNotFound,
    #[error("Something went wrong: {0}")]
    UnknownError(String),
    #[error("Unauthorized")]
    Unauthorized,
}
