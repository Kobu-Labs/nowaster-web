use axum::{
    extract::{Path, Query, State},
    routing::{delete, get},
    Router,
};
use thiserror::Error;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::category::{
        create_category::CreateCategoryDto,
        filter_category::FilterCategoryDto,
        read_category::{CategoryStatsDto, ReadCategoryDto, ReadCategoryWithSessionCountDto},
        update_category::UpdateCategoryDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn category_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(filter_categories_handler)
                .post(create_category_handler)
                .patch(update_category_handler),
        )
        .route(
            "/group-sessions",
            get(get_categories_with_session_count_handler),
        )
        .route("/statistics", get(get_category_statistics_handler))
        .route(
            "/{category_id}",
            delete(delete_category_handler).get(get_category_by_id_handler),
        )
}

#[instrument(err, skip(state), fields(user_id = %actor.user_id))]
async fn create_category_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateCategoryDto>,
) -> ApiResponse<ReadCategoryDto> {
    let res = state.category_service.upsert_category(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(err, skip(state), fields(category_id = %category_id))]
async fn delete_category_handler(
    State(state): State<AppState>,
    Path(category_id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state.category_service.delete_category(category_id).await;
    ApiResponse::from_result(res)
}

#[instrument(err, skip(state), fields(user_id = %actor.user_id))]
async fn filter_categories_handler(
    State(state): State<AppState>,
    Query(payload): Query<FilterCategoryDto>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCategoryDto>> {
    let res = state
        .category_service
        .filter_categories(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument(err, skip(state), fields(user_id = %actor.user_id, category_id = %category_id))]
async fn get_category_by_id_handler(
    State(state): State<AppState>,
    Path(category_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Option<ReadCategoryDto>> {
    let res = state
        .category_service
        .filter_categories(
            FilterCategoryDto {
                id: Some(category_id),
                name: None,
            },
            actor,
        )
        .await
        .map(|val| val.first().cloned());
    ApiResponse::from_result(res)
}

#[instrument(err, skip(state), fields(user_id = %actor.user_id))]
async fn update_category_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateCategoryDto>,
) -> ApiResponse<ReadCategoryDto> {
    let res = state.category_service.update_category(payload, actor).await;
    ApiResponse::from_result(res)
}

#[instrument(err, skip(state), fields(user_id = %actor.user_id))]
async fn get_categories_with_session_count_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCategoryWithSessionCountDto>> {
    let res = state
        .category_service
        .get_categories_with_session_count(actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument(err, skip(state), fields(user_id = %actor.user_id))]
async fn get_category_statistics_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<CategoryStatsDto> {
    let res = state.category_service.get_category_statistics(actor).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum CategoryError {
    #[error("Something went wrong")]
    UnknownError,
}
