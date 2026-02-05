use axum::{
    extract::{Path, Query, State},
    routing::{delete, get},
    Router,
};
use thiserror::Error;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::project::{
        create_project::CreateProjectDto,
        filter_project::FilterProjectDto,
        read_project::{ProjectStatsDto, ReadProjectDetailsDto, ReadProjectDto},
        update_project::UpdateProjectDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn project_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(filter_projects_handler)
                .post(create_project_handler)
                .patch(update_project_handler),
        )
        .route("/details", get(get_projects_details))
        .route("/statistics", get(get_project_statistics_handler))
        .route(
            "/{project_id}",
            delete(delete_project_handler).get(get_project_by_id_handler),
        )
        .route("/{project_id}/tasks", get(get_tasks_by_project_handler))
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn create_project_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateProjectDto>,
) -> ApiResponse<ReadProjectDto> {
    let res = state.project_service.create_project(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(project_id = %project_id, user_id = %actor))]
async fn delete_project_handler(
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<()> {
    let res = state
        .project_service
        .delete_project(project_id, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn filter_projects_handler(
    State(state): State<AppState>,
    Query(payload): Query<FilterProjectDto>,
    actor: Actor,
) -> ApiResponse<Vec<ReadProjectDto>> {
    let res = state.project_service.filter_projects(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor, project_id = %project_id))]
async fn get_project_by_id_handler(
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Option<ReadProjectDto>> {
    let res = state
        .project_service
        .get_by_id(project_id, actor)
        .await
        .map(|val| Some(ReadProjectDto::from(val)));
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn update_project_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateProjectDto>,
) -> ApiResponse<ReadProjectDto> {
    let res = state.project_service.update_project(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn get_projects_details(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadProjectDetailsDto>> {
    let res = state.project_service.get_projects_details(actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn get_project_statistics_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<ProjectStatsDto> {
    let res = state.project_service.get_project_statistics(actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor, project_id = %project_id))]
async fn get_tasks_by_project_handler(
    State(state): State<AppState>,
    Path(project_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Vec<crate::dto::task::read_task::ReadTaskDto>> {
    let res = state
        .task_service
        .get_tasks_by_project(project_id, actor)
        .await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum ProjectError {
    #[error("Something went wrong")]
    UnknownError,
}
