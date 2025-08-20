use axum::{
    extract::{Path, State},
    routing::{delete, get},
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::session::template::{CreateSessionTemplateDto, UpdateSessionTemplateDto},
    entity::session_template::ExistingSessionsAction,
    repository::session_template::ReadSesionTemplateRow,
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn session_template_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(get_templates)
                .post(create_handler)
                .patch(update_session_template),
        )
        .route("/{id}/{action}", delete(delete_session_template))
        .nest("/recurring", recurring_session_router())
}

pub fn recurring_session_router() -> Router<AppState> {
    Router::new().route("/", delete(delete_recurring_session))
}

#[instrument( skip(state), fields(user_id = %actor.user_id))]
async fn get_templates(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadSesionTemplateRow>> {
    let res = state.session_template_service.get_templates(actor).await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor.user_id))]
async fn create_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateSessionTemplateDto>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .create_template(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor.user_id))]
async fn update_session_template(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateSessionTemplateDto>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .update_session_template(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor.user_id, id = %id))]
async fn delete_recurring_session(
    State(state): State<AppState>,
    actor: Actor,
    Path(id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .delete_recurring_session(id, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor.user_id, id = %id))]
async fn delete_session_template(
    State(state): State<AppState>,
    actor: Actor,
    Path((id, action)): Path<(Uuid, ExistingSessionsAction)>,
) -> ApiResponse<()> {
    let res = state
        .session_template_service
        .delete_session_template(id, action, actor)
        .await;
    ApiResponse::from_result(res)
}
