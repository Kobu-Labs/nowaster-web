use axum::{
    extract::{Path, Query, State},
    routing::get,
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community::{
        invite_code::{CommunityInvitePreviewDto, ReadInviteCodeDto},
        join_community::JoinCommunityDto,
        read_member::{ListCommunityMembersParamsDto, ReadCommunityMemberDto, ReadCommunityMembersPageDto},
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
        .route("/{community_id}/invite-code", get(get_invite_code_handler))
        .route(
            "/{community_id}/invite-code/regenerate",
            axum::routing::post(regenerate_invite_code_handler),
        )
        .route("/invite/{code}", get(preview_by_invite_code_handler))
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

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn get_invite_code_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<ReadInviteCodeDto> {
    let result = state
        .community_service
        .get_invite_code(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn regenerate_invite_code_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<ReadInviteCodeDto> {
    let result = state
        .community_service
        .regenerate_invite_code(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, code = %code))]
async fn preview_by_invite_code_handler(
    State(state): State<AppState>,
    Path(code): Path<String>,
    actor: Actor,
) -> ApiResponse<CommunityInvitePreviewDto> {
    let _ = &actor;
    let result = state.community_service.preview_by_invite_code(&code).await;
    ApiResponse::from_result(result)
}
