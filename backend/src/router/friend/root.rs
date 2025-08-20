use axum::{
    extract::{Query, State},
    routing::{delete, patch},
    Router,
};
use tracing::instrument;

use crate::{
    repository::friends::UpdateFriendRequestDto,
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
    service::friend_service::{
        AcceptFriendRequestDto, CancelFriendRequestDto, CreateFriendRequestDto,
        FriendRequestStatus, ProcessFriendRequestDto, ReadFriendRequestDto, ReadFriendRequestsDto,
        ReadFriendshipDto, RejectFriendRequestDto, RemoveFriendDto,
    },
};

pub fn friend_router() -> Router<AppState> {
    Router::new()
        .route(
            "/request",
            patch(update_friend_request_handler)
                .post(create_friend_request_handler)
                .get(list_friend_requests_handler),
        )
        .route(
            "/friend",
            delete(remove_friend_handler).get(list_friends_handler),
        )
}

#[instrument( skip(state), fields(user_id = %actor.user_id, request_id = %payload.request_id))]
async fn update_friend_request_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateFriendRequestDto>,
) -> ApiResponse<ReadFriendRequestDto> {
    let result = match payload.status {
        FriendRequestStatus::Accepted => {
            state
                .friend_service
                .accept_friend_request(
                    AcceptFriendRequestDto {
                        request_id: payload.request_id,
                    },
                    actor,
                )
                .await
        }
        FriendRequestStatus::Rejected => {
            state
                .friend_service
                .reject_friend_request(
                    RejectFriendRequestDto {
                        request_id: payload.request_id,
                    },
                    actor,
                )
                .await
        }
        FriendRequestStatus::Cancelled => {
            state
                .friend_service
                .cancel_friend_request(
                    CancelFriendRequestDto {
                        request_id: payload.request_id,
                    },
                    actor,
                )
                .await
        }
        FriendRequestStatus::Pending => Err(anyhow::anyhow!(
            "You cannot update a pending friend request"
        )),
    };

    ApiResponse::from_result(result)
}

#[instrument( skip(state), fields(user_id = %actor.user_id, recipient_name = %payload.recipient_name))]
async fn create_friend_request_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<ProcessFriendRequestDto>,
) -> ApiResponse<ReadFriendRequestDto> {
    let recipient = state
        .user_service
        .get_user_by_name(payload.recipient_name)
        .await;

    let recipient = match recipient {
        Ok(user) => match user {
            Some(user) => user,
            None => {
                return ApiResponse::Error {
                    message: String::from("User not found"),
                }
            }
        },
        Err(e) => {
            return ApiResponse::Error {
                message: e.to_string(),
            }
        }
    };

    let result = state
        .friend_service
        .create_friend_request(
            CreateFriendRequestDto {
                recipient_id: recipient.id,
                introduction_message: payload.introduction_message,
            },
            actor,
        )
        .await;
    ApiResponse::from_result(result)
}

#[instrument( skip(state), fields(user_id = %actor.user_id))]
async fn list_friend_requests_handler(
    State(state): State<AppState>,
    Query(direction): Query<ReadFriendRequestsDto>,
    actor: Actor,
) -> ApiResponse<Vec<ReadFriendRequestDto>> {
    let result = state
        .friend_service
        .list_friend_requests(
            actor,
            ReadFriendRequestsDto {
                direction: direction.direction,
            },
        )
        .await;
    ApiResponse::from_result(result)
}

fn get_other_friend_id(user_id: String, friendship: ReadFriendshipDto) -> String {
    if friendship.friend1.id == user_id {
        friendship.friend2.id
    } else {
        friendship.friend1.id
    }
}

#[instrument( skip(state), fields(user_id = %actor.user_id))]
async fn list_friends_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadFriendshipDto>> {
    let result = state.friend_service.list_friends(actor.clone()).await;

    ApiResponse::from_result(result)
}

#[instrument( skip(state), fields(user_id = %actor.user_id))]
async fn remove_friend_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<RemoveFriendDto>,
) -> ApiResponse<()> {
    let result = state.friend_service.remove_friend(payload, actor).await;
    ApiResponse::from_result(result)
}
