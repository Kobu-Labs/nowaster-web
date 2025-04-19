use axum::{
    extract::{Path, Query, State},
    routing::{delete, get},
    Router,
};
use thiserror::Error;
use uuid::Uuid;

use crate::{
    dto::category::{
        create_category::CreateCategoryDto, filter_category::FilterCategoryDto,
        read_category::ReadCategoryDto, update_category::UpdateCategoryDto,
    },
    router::{clerk::ClerkUser, request::ValidatedRequest, response::ApiResponse, root::AppState},
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
            "/{category_id}",
            delete(delete_category_handler).get(get_category_by_id_handler),
        )
}

async fn create_category_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<CreateCategoryDto>,
) -> ApiResponse<ReadCategoryDto> {
    let res = state.category_service.upsert_category(payload, actor).await;
    ApiResponse::from_result(res)
}

async fn delete_category_handler(
    State(state): State<AppState>,
    Path(category_id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state.category_service.delete_category(category_id).await;
    ApiResponse::from_result(res)
}

async fn filter_categories_handler(
    State(state): State<AppState>,
    Query(payload): Query<FilterCategoryDto>,
    actor: ClerkUser,
) -> ApiResponse<Vec<ReadCategoryDto>> {
    let res = state
        .category_service
        .filter_categories(payload, actor)
        .await;
    ApiResponse::from_result(res)
}

async fn get_category_by_id_handler(
    State(state): State<AppState>,
    Path(category_id): Path<Uuid>,
    actor: ClerkUser,
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

async fn update_category_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<UpdateCategoryDto>,
) -> ApiResponse<ReadCategoryDto> {
    let res = state.category_service.update_category(payload, actor).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum CategoryError {
    #[error("Something went wrong")]
    UnknownError,
}
