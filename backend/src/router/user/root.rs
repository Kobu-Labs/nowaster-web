use crate::dto::user::read_user::ReadUserDto;
use crate::router::request::ValidatedRequest;
use crate::router::response::ApiResponse;
use crate::{dto::user::create_user::CreateUserDto, router::root::AppState};
use axum::{extract::State, routing::post, Router};
use thiserror::Error;

pub fn user_router() -> Router<AppState> {
    Router::new().route("/create", post(crate_user_handler))
}

async fn crate_user_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<CreateUserDto>,
) -> ApiResponse<ReadUserDto> {
    let res = state.user_service.upsert_user(payload).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum UserError {
    #[error("Something went wrong")]
    UnknownError(String),
}
