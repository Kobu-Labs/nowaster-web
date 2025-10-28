use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::release::{CreateReleaseDto, ReadReleaseDto, ReleaseListQueryDto, UpdateReleaseDto},
    router::{admin::AdminUser, response::ApiResponse, root::AppState},
};

pub fn admin_release_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_all_releases).post(create_release))
        .route(
            "/{release_id}",
            get(get_release)
                .patch(update_release)
                .delete(delete_release),
        )
        .route("/{release_id}/publish", post(publish_release))
        .route("/{release_id}/unpublish", post(unpublish_release))
}

#[instrument(skip(state))]
async fn list_all_releases(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Query(query): Query<ReleaseListQueryDto>,
) -> Result<Json<ApiResponse<Vec<ReadReleaseDto>>>, StatusCode> {
    let releases = state
        .release_service
        .list_releases(query)
        .await
        .map_err(|e| {
            tracing::error!("Failed to list releases: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: releases }))
}

#[instrument(skip(state))]
async fn create_release(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Json(dto): Json<CreateReleaseDto>,
) -> Result<Json<ApiResponse<ReadReleaseDto>>, StatusCode> {
    let release = state
        .release_service
        .create_release(dto)
        .await
        .map_err(|e| {
            tracing::error!("Failed to create release: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: release }))
}

#[instrument(skip(state))]
async fn get_release(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(release_id): Path<Uuid>,
) -> Result<Json<ApiResponse<ReadReleaseDto>>, StatusCode> {
    let release = state
        .release_service
        .get_release_by_id(release_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get release: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    match release {
        Some(r) => Ok(Json(ApiResponse::Success { data: r })),
        None => Err(StatusCode::NOT_FOUND),
    }
}

#[instrument(skip(state))]
async fn update_release(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(release_id): Path<Uuid>,
    Json(dto): Json<UpdateReleaseDto>,
) -> Result<Json<ApiResponse<ReadReleaseDto>>, StatusCode> {
    let release = state
        .release_service
        .update_release(release_id, dto)
        .await
        .map_err(|e| {
            tracing::error!("Failed to update release: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: release }))
}

#[instrument(skip(state))]
async fn delete_release(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(release_id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    state
        .release_service
        .delete_release(release_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to delete release: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: () }))
}

#[instrument(skip(state))]
async fn publish_release(
    State(state): State<AppState>,
    AdminUser(admin): AdminUser,
    Path(release_id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    state
        .release_service
        .publish_release(release_id, admin.user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to publish release: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: () }))
}

#[instrument(skip(state))]
async fn unpublish_release(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(release_id): Path<Uuid>,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    state
        .release_service
        .unpublish_release(release_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to unpublish release: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: () }))
}
