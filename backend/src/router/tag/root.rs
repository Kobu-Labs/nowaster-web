use anyhow::Result;
use axum::extract::{Path, Query};
use axum::routing::delete;
use axum::{extract::State, routing::post, Router};
use thiserror::Error;
use uuid::Uuid;

use crate::dto::tag::add_category::AddAllowedCategoryDto;
use crate::dto::tag::create_tag::{UpdateTagDto, CreateTagDto};
use crate::dto::tag::filter_tags::TagFilterDto;
use crate::dto::tag::read_tag::ReadTagDetailsDto;
use crate::router::request::ValidatedRequest;
use crate::router::response::ApiResponse;
use crate::router::root::AppState;

pub fn tag_router() -> Router<AppState> {
    Router::new()
        .route(
            "/category",
            post(add_allowed_category_handler).delete(remove_allowed_category_handler),
        )
        .route("/", post(create_tag_handler).get(filter_tags_handler))
        .route(
            "/{tag_id}",
            delete(delete_tag_handler)
                .get(get_tag_handler)
                .patch(update_tag_handler),
        )
}

async fn update_tag_handler(
    State(state): State<AppState>,
    Path(tag_id): Path<Uuid>,
    ValidatedRequest(payload): ValidatedRequest<UpdateTagDto>,
) -> ApiResponse<ReadTagDetailsDto> {
    let res = state.tag_service.update_tag(tag_id, payload).await;
    ApiResponse::from_result(res)
}

async fn add_allowed_category_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<AddAllowedCategoryDto>,
) -> ApiResponse<()> {
    let tag = state.tag_service.get_by_id(payload.tag_id).await;
    let Ok(tag) = tag else {
        return ApiResponse::Error {
            message: "Tag not found".to_string(),
        };
    };

    let category = state.category_service.get_by_id(payload.category_id).await;
    let Ok(category) = category else {
        return ApiResponse::Error {
            message: "Category not found".to_string(),
        };
    };

    let res = state
        .tag_service
        .add_allowed_category(&tag, &category)
        .await;

    ApiResponse::from_result(res)
}

async fn get_tag_handler(
    State(state): State<AppState>,
    Path(tag_id): Path<Uuid>,
) -> ApiResponse<ReadTagDetailsDto> {
    let res = state.tag_service.get_by_id(tag_id).await;
    let dto: Result<ReadTagDetailsDto> = res.map(ReadTagDetailsDto::from);
    ApiResponse::from_result(dto)
}

async fn remove_allowed_category_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<AddAllowedCategoryDto>,
) -> ApiResponse<()> {
    let tag = state.tag_service.get_by_id(payload.tag_id).await;
    let Ok(tag) = tag else {
        return ApiResponse::Error {
            message: "Tag not found".to_string(),
        };
    };

    let category = state.category_service.get_by_id(payload.category_id).await;
    let Ok(category) = category else {
        return ApiResponse::Error {
            message: "Category not found".to_string(),
        };
    };

    let res = state
        .tag_service
        .remove_allowed_category(&tag, &category)
        .await;

    ApiResponse::from_result(res)
}

async fn create_tag_handler(
    State(state): State<AppState>,
    ValidatedRequest(payload): ValidatedRequest<CreateTagDto>,
) -> ApiResponse<ReadTagDetailsDto> {
    let res = state.tag_service.create_tag(payload).await;
    ApiResponse::from_result(res)
}

async fn filter_tags_handler(
    State(state): State<AppState>,
    Query(payload): Query<TagFilterDto>,
) -> ApiResponse<Vec<ReadTagDetailsDto>> {
    let res = state.tag_service.filter_tags(payload).await;
    ApiResponse::from_result(res)
}

async fn delete_tag_handler(
    State(state): State<AppState>,
    Path(tag_id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state.tag_service.delete_tag(tag_id).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum TagError {
    #[error("Something went wrong")]
    UnknownError(String),
}
