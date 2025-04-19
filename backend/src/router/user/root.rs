use crate::dto::user::read_user::ReadUserDto;
use crate::dto::user::update_user::UpdateUserDto;
use crate::router::clerk::ClerkUser;
use crate::router::request::ValidatedRequest;
use crate::router::response::ApiResponse;
use crate::{dto::user::create_user::CreateUserDto, router::root::AppState};
use axum::{extract::State, routing::post, Router};
use thiserror::Error;

pub fn user_router() -> Router<AppState> {
    Router::new().route("/", post(crate_user_handler).patch(update_user_handler))
}

async fn crate_user_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<CreateUserDto>,
) -> ApiResponse<ReadUserDto> {
    let res = state.user_service.create(payload).await;
    ApiResponse::from_result(res)
}

async fn update_user_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<UpdateUserDto>,
) -> ApiResponse<ReadUserDto> {
    let res = state.user_service.update_user(payload, actor).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum UserError {
    #[error("Something went wrong")]
    UnknownError(String),
    #[error("Unauthorized")]
    Unauthorized,
}
