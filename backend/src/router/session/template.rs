use axum::{extract::State, routing::get, Router};

use crate::{
    dto::session::template::CreateSessionTemplateDto,
    repository::recurring_session::ReadSesionTemplateRow,
    router::{clerk::ClerkUser, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn session_template_router() -> Router<AppState> {
    Router::new().route("/", get(get_templates).post(create_handler))
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
