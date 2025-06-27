use axum::{
    extract::{Path, State},
    routing::{delete, get, patch},
    Router,
};
use uuid::Uuid;

use crate::{
    dto::session::template::{CreateSessionTemplateDto, UpdateRecurringSessionDto},
    repository::recurring_session::ReadSesionTemplateRow,
    router::{clerk::ClerkUser, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn session_template_router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_templates).post(create_handler))
        .route("/{id}", delete(delete_session_template))
        .nest("/recurring", recurring_session_router())
}

pub fn recurring_session_router() -> Router<AppState> {
    Router::new().route(
        "/",
        patch(update_recurring_session).delete(delete_recurring_session),
    )
}

async fn get_templates(
    State(state): State<AppState>,
    actor: ClerkUser,
) -> ApiResponse<Vec<ReadSesionTemplateRow>> {
    let res = state.session_template_service.get_templates(actor).await;
    ApiResponse::from_result(res)
}

async fn create_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<CreateSessionTemplateDto>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .create_template(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

async fn update_recurring_session(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<UpdateRecurringSessionDto>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .update_recurring_session(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

async fn delete_recurring_session(
    State(state): State<AppState>,
    actor: ClerkUser,
    Path(id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .delete_recurring_session(id, actor)
        .await;
    ApiResponse::from_result(res)
}

async fn delete_session_template(
    State(state): State<AppState>,
    actor: ClerkUser,
    Path(id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .delete_session_template(id, actor)
        .await;
    ApiResponse::from_result(res)
}
