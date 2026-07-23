use axum::{
    extract::{Path, State},
    routing::get,
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community::{
        create_community::CreateCommunityDto, read_community::ReadCommunityDto,
        update_community::UpdateCommunityDto,
    },
    router::{
        clerk::Actor, community::membership::membership_routes, request::ValidatedRequest,
        response::ApiResponse, root::AppState,
    },
};

pub fn community_router() -> Router<AppState> {
    crud_routes().merge(membership_routes())
}

fn crud_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(list_my_communities_handler).post(create_community_handler),
        )
        .route(
            "/{community_id}",
            get(get_community_handler)
                .patch(update_community_handler)
                .delete(archive_community_handler),
        )
}

#[instrument(skip(state), fields(user_id = %actor, community_name = %payload.name))]
async fn create_community_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateCommunityDto>,
) -> ApiResponse<ReadCommunityDto> {
    let result = state
        .community_service
        .create_community(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn list_my_communities_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCommunityDto>> {
    let result = state.community_service.list_my_communities(&actor).await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn get_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<ReadCommunityDto> {
    let result = state
        .community_service
        .get_community(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn update_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<UpdateCommunityDto>,
) -> ApiResponse<ReadCommunityDto> {
    payload.id = community_id;
    let result = state
        .community_service
        .update_community(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn archive_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state
        .community_service
        .archive_community(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}
