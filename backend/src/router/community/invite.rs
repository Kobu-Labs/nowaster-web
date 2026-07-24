use axum::{
    extract::{Path, State},
    routing::{get, post},
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community::invite::{
        CommunityInvitePreviewDto, CreateDirectInviteDto, CreateLinkInviteDto, JoinViaCodeDto,
        ReadCommunityInviteDto, RespondToInviteDto, RevokeInviteDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn invite_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/{community_id}/invites",
            get(list_community_invites_handler).post(create_direct_invite_handler),
        )
        .route(
            "/{community_id}/invites/link",
            post(create_link_invite_handler),
        )
        .route(
            "/{community_id}/invites/{invite_id}",
            axum::routing::delete(revoke_invite_handler),
        )
        .route("/invites/inbox", get(list_incoming_invites_handler))
        .route(
            "/invites/{invite_id}",
            axum::routing::patch(respond_to_invite_handler),
        )
        .route("/join/{code}", post(join_via_code_handler))
        .route("/join/{code}/preview", get(preview_by_code_handler))
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn create_direct_invite_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<CreateDirectInviteDto>,
) -> ApiResponse<ReadCommunityInviteDto> {
    payload.community_id = community_id;
    let result = state
        .community_invite_service
        .create_direct_invite(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn create_link_invite_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<CreateLinkInviteDto>,
) -> ApiResponse<ReadCommunityInviteDto> {
    payload.community_id = community_id;
    let result = state
        .community_invite_service
        .create_link_invite(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn list_community_invites_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCommunityInviteDto>> {
    let result = state
        .community_invite_service
        .list_community_invites(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn list_incoming_invites_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCommunityInviteDto>> {
    let result = state
        .community_invite_service
        .list_incoming_invites(&actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, invite_id = %invite_id))]
async fn respond_to_invite_handler(
    State(state): State<AppState>,
    Path(invite_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<RespondToInviteDto>,
) -> ApiResponse<ReadCommunityInviteDto> {
    payload.invite_id = invite_id;
    let result = state
        .community_invite_service
        .respond_to_invite(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, invite_id = %invite_id))]
async fn revoke_invite_handler(
    State(state): State<AppState>,
    Path((community_id, invite_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state
        .community_invite_service
        .revoke_invite(
            RevokeInviteDto {
                community_id,
                invite_id,
            },
            &actor,
        )
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, code = %code))]
async fn join_via_code_handler(
    State(state): State<AppState>,
    Path(code): Path<String>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state
        .community_invite_service
        .join_via_code(JoinViaCodeDto { code }, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, code = %code))]
async fn preview_by_code_handler(
    State(state): State<AppState>,
    Path(code): Path<String>,
    actor: Actor,
) -> ApiResponse<CommunityInvitePreviewDto> {
    let _ = &actor;
    let result = state.community_invite_service.preview_by_code(&code).await;
    ApiResponse::from_result(result)
}
