use axum::{
    extract::{Path, Query, State},
    routing::{get, patch},
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community::{
        join_community::JoinCommunityDto,
        read_member::{
            CommunityCapabilitiesDto, ListCommunityMembersParamsDto, ReadCommunityMemberDto,
            ReadCommunityMembersPageDto, RemoveMemberDto, UpdateMemberRoleDto,
        },
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn membership_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/{community_id}/members",
            get(list_community_members_handler).post(join_community_handler),
        )
        .route(
            "/{community_id}/members/me",
            axum::routing::delete(leave_community_handler),
        )
        .route(
            "/{community_id}/members/{user_id}/role",
            patch(update_member_role_handler),
        )
        .route(
            "/{community_id}/members/{user_id}",
            axum::routing::delete(remove_member_handler),
        )
        .route(
            "/{community_id}/capabilities",
            get(get_capabilities_handler),
        )
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, target_user = %user_id))]
async fn update_member_role_handler(
    State(state): State<AppState>,
    Path((community_id, user_id)): Path<(Uuid, String)>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<UpdateMemberRoleDto>,
) -> ApiResponse<ReadCommunityMemberDto> {
    payload.community_id = community_id;
    payload.user_id = user_id;
    let result = state
        .community_service
        .update_member_role(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, target_user = %user_id))]
async fn remove_member_handler(
    State(state): State<AppState>,
    Path((community_id, user_id)): Path<(Uuid, String)>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state
        .community_service
        .remove_member(
            RemoveMemberDto {
                community_id,
                user_id,
            },
            &actor,
        )
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn get_capabilities_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<CommunityCapabilitiesDto> {
    let result = state
        .community_service
        .get_capabilities(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn join_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<JoinCommunityDto>,
) -> ApiResponse<ReadCommunityMemberDto> {
    payload.community_id = community_id;
    let result = state
        .community_service
        .join_community(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn leave_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state
        .community_service
        .leave_community(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn list_community_members_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    Query(params): Query<ListCommunityMembersParamsDto>,
    actor: Actor,
) -> ApiResponse<ReadCommunityMembersPageDto> {
    let result = state
        .community_service
        .list_members(community_id, &actor, params.limit, params.offset)
        .await;
    ApiResponse::from_result(result)
}
