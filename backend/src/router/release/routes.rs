use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::get,
    Json, Router,
};
use tracing::instrument;

use crate::{
    dto::release::{LatestUnseenReleaseDto, ReadPublicReleaseDto},
    router::{clerk::OptionalActor, response::ApiResponse, root::AppState},
};

pub fn release_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_public_releases))
        .route("/latest", get(get_latest_release_unseen))
        .route("/{version}", get(get_release_by_version))
}

#[instrument(skip(state))]
async fn list_public_releases(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<ReadPublicReleaseDto>>>, StatusCode> {
    let releases = state
        .release_service
        .list_public_releases()
        .await
        .map_err(|e| {
            tracing::error!("Failed to list public releases: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    Ok(Json(ApiResponse::Success { data: releases }))
}

#[instrument(skip(state))]
async fn get_release_by_version(
    State(state): State<AppState>,
    Path(version): Path<String>,
    OptionalActor(actor): OptionalActor,
) -> Result<Json<ApiResponse<ReadPublicReleaseDto>>, StatusCode> {
    let release = state
        .release_service
        .get_public_release_by_version(version.clone(), actor.map(|a| a.user_id))
        .await
        .map_err(|e| {
            tracing::error!("Failed to get release {}: {}", version, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    match release {
        Some(r) => Ok(Json(ApiResponse::Success { data: r })),
        None => Err(StatusCode::NOT_FOUND),
    }
}

#[instrument(skip(state))]
async fn get_latest_release_unseen(
    State(state): State<AppState>,
    OptionalActor(actor): OptionalActor,
) -> Result<Json<ApiResponse<LatestUnseenReleaseDto>>, StatusCode> {
    let result = match actor {
        Some(a) => {
            // Authenticated user - check if unseen and mark as seen
            state
                .release_service
                .get_latest_unseen_for_user(a.user_id)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to get latest unseen release: {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?
        }
        None => {
            // Unauthenticated user - just return latest release with unseen=false
            let latest = state
                .release_service
                .get_latest_released(None)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to get latest release: {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

            latest.map(|release| LatestUnseenReleaseDto {
                release,
                unseen: false,
            })
        }
    };

    match result {
        Some(dto) => Ok(Json(ApiResponse::Success { data: dto })),
        None => Err(StatusCode::NOT_FOUND),
    }
}
