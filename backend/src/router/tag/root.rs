use anyhow::Result;
use axum::extract::{Path, Query};
use axum::routing::delete;
use axum::{extract::State, routing::post, Router};
use thiserror::Error;
use uuid::Uuid;

use crate::dto::tag::add_category::AddAllowedCategoryDto;
use crate::dto::tag::create_tag::{CreateTagDto, UpdateTagDto};
use crate::dto::tag::filter_tags::TagFilterDto;
use crate::dto::tag::read_tag::ReadTagDetailsDto;
use crate::router::clerk::ClerkUser;
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
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<UpdateTagDto>,
) -> ApiResponse<ReadTagDetailsDto> {
    let res = state.tag_service.update_tag(tag_id, payload, actor).await;
    ApiResponse::from_result(res)
}

async fn add_allowed_category_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<AddAllowedCategoryDto>,
) -> ApiResponse<()> {
    let tag = state
        .tag_service
        .get_by_id(payload.tag_id, actor.clone())
        .await;
    let Ok(tag) = tag else {
        return ApiResponse::Error {
            message: "Tag not found".to_string(),
        };
    };

    let category = state
        .category_service
        .get_by_id(payload.category_id, actor.clone())
        .await;
    let Ok(category) = category else {
        return ApiResponse::Error {
            message: "Category not found".to_string(),
        };
    };

    let res = state
        .tag_service
        .add_allowed_category(&tag, &category, actor.clone())
        .await;

    ApiResponse::from_result(res)
}

async fn get_tag_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    Path(tag_id): Path<Uuid>,
) -> ApiResponse<ReadTagDetailsDto> {
    let res = state.tag_service.get_by_id(tag_id, actor).await;
    let dto: Result<ReadTagDetailsDto> = res.map(ReadTagDetailsDto::from);
    ApiResponse::from_result(dto)
}

async fn remove_allowed_category_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<AddAllowedCategoryDto>,
) -> ApiResponse<()> {
    let tag = state
        .tag_service
        .get_by_id(payload.tag_id, actor.clone())
        .await;
    let Ok(tag) = tag else {
        return ApiResponse::Error {
            message: "Tag not found".to_string(),
        };
    };

    let category = state
        .category_service
        .get_by_id(payload.category_id, actor.clone())
        .await;
    let Ok(category) = category else {
        return ApiResponse::Error {
            message: "Category not found".to_string(),
        };
    };

    let res = state
        .tag_service
        .remove_allowed_category(&tag, &category, actor.clone())
        .await;

    ApiResponse::from_result(res)
}

async fn create_tag_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<CreateTagDto>,
) -> ApiResponse<ReadTagDetailsDto> {
    let res = state.tag_service.create_tag(payload, actor).await;
    ApiResponse::from_result(res)
}

async fn filter_tags_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    Query(payload): Query<TagFilterDto>,
) -> ApiResponse<Vec<ReadTagDetailsDto>> {
    let res = state.tag_service.filter_tags(payload, actor).await;
    ApiResponse::from_result(res)
}

async fn delete_tag_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    Path(tag_id): Path<Uuid>,
) -> ApiResponse<()> {
    let res = state.tag_service.delete_tag(tag_id, actor).await;
    ApiResponse::from_result(res)
}

#[derive(Error, Debug)]
pub enum TagError {
    #[error("Something went wrong")]
    UnknownError(String),
}
