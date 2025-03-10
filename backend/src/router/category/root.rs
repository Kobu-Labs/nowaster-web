use axum::{
    extract::{Path, Query, State},
    routing::{delete, post},
    Router,
};
use thiserror::Error;
use uuid::Uuid;

use crate::{
    dto::category::{
        create_category::CreateCategoryDto, filter_category::FilterCategoryDto,
        read_category::ReadCategoryDto,
    },
    router::{request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn category_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            post(create_category_handler).get(filter_categories_handler),
        )
        .route("/{category_id}", delete(delete_category_handler))
}

async fn create_category_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<CreateCategoryDto>,
) -> ApiResponse<ReadCategoryDto> {
    let res = state.category_service.upsert_category(payload).await;
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
) -> ApiResponse<Vec<ReadCategoryDto>> {
    let res = state.category_service.filter_categories(payload).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum CategoryError {
    #[error("Something went wrong")]
    UnknownError,
}
