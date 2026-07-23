use axum::{
    extract::{Path, State},
    routing::{get, post},
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community_category::{
        create_mapping::CreateCategoryMappingDto,
        create_tracked_category::CreateTrackedCategoryDto, read_mapping::ReadCategoryMappingDto,
        read_tracked_category::ReadTrackedCategoryDto,
        update_tracked_category::UpdateTrackedCategoryDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn category_mapping_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/{community_id}/tracked-categories",
            post(create_tracked_category_handler).get(list_tracked_categories_handler),
        )
        .route(
            "/{community_id}/tracked-categories/{tracked_category_id}",
            axum::routing::patch(update_tracked_category_handler)
                .delete(delete_tracked_category_handler),
        )
        .route(
            "/{community_id}/category-mappings",
            post(create_mapping_handler),
        )
        .route(
            "/{community_id}/category-mappings/me",
            get(list_my_mappings_handler),
        )
        .route(
            "/{community_id}/category-mappings/{mapping_id}",
            axum::routing::delete(delete_mapping_handler),
        )
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, name = %payload.name))]
async fn create_tracked_category_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateTrackedCategoryDto>,
) -> ApiResponse<ReadTrackedCategoryDto> {
    let result = state
        .community_category_service
        .create_tracked_category(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn list_tracked_categories_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Vec<ReadTrackedCategoryDto>> {
    let result = state
        .community_category_service
        .list_tracked_categories(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, tracked_category_id = %tracked_category_id))]
async fn update_tracked_category_handler(
    State(state): State<AppState>,
    Path((community_id, tracked_category_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<UpdateTrackedCategoryDto>,
) -> ApiResponse<ReadTrackedCategoryDto> {
    let _ = community_id;
    payload.id = tracked_category_id;
    let result = state
        .community_category_service
        .update_tracked_category(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, tracked_category_id = %tracked_category_id))]
async fn delete_tracked_category_handler(
    State(state): State<AppState>,
    Path((community_id, tracked_category_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<()> {
    let _ = community_id;
    let result = state
        .community_category_service
        .delete_tracked_category(tracked_category_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn create_mapping_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateCategoryMappingDto>,
) -> ApiResponse<ReadCategoryMappingDto> {
    let result = state
        .community_category_service
        .create_mapping(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn list_my_mappings_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCategoryMappingDto>> {
    let result = state
        .community_category_service
        .list_my_mappings(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, mapping_id = %mapping_id))]
async fn delete_mapping_handler(
    State(state): State<AppState>,
    Path((community_id, mapping_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<()> {
    let _ = community_id;
    let result = state
        .community_category_service
        .delete_mapping(mapping_id, &actor)
        .await;
    ApiResponse::from_result(result)
}
