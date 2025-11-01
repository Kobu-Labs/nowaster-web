use axum::{
    extract::{Path, Query, State},
    routing::{delete, get},
    Router,
};
use thiserror::Error;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::task::{
        create_task::CreateTaskDto,
        filter_task::FilterTaskDto,
        read_task::{ReadTaskDto, TaskStatsDto},
        update_task::UpdateTaskDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn task_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(filter_tasks_handler)
                .post(create_task_handler)
                .patch(update_task_handler),
        )
        .route("/statistics", get(get_task_statistics_handler))
        .route(
            "/{task_id}",
            delete(delete_task_handler).get(get_task_by_id_handler),
        )
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn create_task_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateTaskDto>,
) -> ApiResponse<ReadTaskDto> {
    let res = state.task_service.create_task(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(task_id = %task_id, user_id = %actor))]
async fn delete_task_handler(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<()> {
    let res = state.task_service.delete_task(task_id, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn filter_tasks_handler(
    State(state): State<AppState>,
    Query(payload): Query<FilterTaskDto>,
    actor: Actor,
) -> ApiResponse<Vec<ReadTaskDto>> {
    let res = state.task_service.filter_tasks(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor, task_id = %task_id))]
async fn get_task_by_id_handler(
    State(state): State<AppState>,
    Path(task_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Option<ReadTaskDto>> {
    let res = state
        .task_service
        .get_by_id(task_id, actor)
        .await
        .map(|val| Some(ReadTaskDto::from(val)));
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn update_task_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateTaskDto>,
) -> ApiResponse<ReadTaskDto> {
    let res = state.task_service.update_task(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn get_task_statistics_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<TaskStatsDto> {
    let res = state.task_service.get_task_statistics(actor).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum TaskError {
    #[error("Something went wrong")]
    UnknownError,
}
