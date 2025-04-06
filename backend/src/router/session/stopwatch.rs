use axum::{
    extract::{Path, State},
    routing::{delete, get},
    Router,
};
use uuid::Uuid;

use crate::{
    dto::session::stopwatch_session::{
        CreateStopwatchSessionDto, ReadStopwatchSessionDto, UpdateStopwatchSessionDto,
    },
    router::{clerk::ClerkUser, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn stopwatch_session_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(get_stopwatch_session_handler)
                .post(create_handler)
                .patch(update_handler),
        )
        .route("/{session_id}", delete(delete_handler))
}

async fn get_stopwatch_session_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
) -> ApiResponse<Option<ReadStopwatchSessionDto>> {
    let res = state.stopwatch_service.read_stopwatch_session(actor).await;
    ApiResponse::from_result(res)
}

async fn create_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<CreateStopwatchSessionDto>,
) -> ApiResponse<ReadStopwatchSessionDto> {
    let res = state
        .stopwatch_service
        .create_stopwatch_session(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

async fn delete_handler(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    actor: ClerkUser,
) -> ApiResponse<()> {
    let res = state
        .stopwatch_service
        .delete_stopwatch_session(session_id, actor)
        .await;
    ApiResponse::from_result(res)
}

async fn update_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<UpdateStopwatchSessionDto>,
) -> ApiResponse<ReadStopwatchSessionDto> {
    let res = state
        .stopwatch_service
        .update_stopwatch_session(payload, actor)
        .await;

    ApiResponse::from_result(res)
}
