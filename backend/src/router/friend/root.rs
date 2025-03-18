use axum::{
    extract::{Query, State},
    routing::{delete, patch},
    Router,
};

use crate::{
    repository::friends::UpdateFriendRequestDto,
    router::{clerk::ClerkUser, request::ValidatedRequest, response::ApiResponse, root::AppState},
    service::friend_service::{
        AcceptFriendRequestDto, CancelFriendRequestDto, CreateFriendRequestDto,
        FriendRequestStatus, ProcessFriendRequestDto, ReadFriendRequestDto, ReadFriendRequestsDto,
        ReadFriendshipDto, ReadFriendshipWithAvatarDto, ReadUserAvatarDto, RejectFriendRequestDto,
        RemoveFriendDto,
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

async fn update_friend_request_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
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

async fn create_friend_request_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<ProcessFriendRequestDto>,
) -> ApiResponse<ReadFriendRequestDto> {
    let recipient = state
        .user_service
        .get_user_by_name(payload.recipient_name)
        .await;

    let recipient = match recipient {
        Ok(user) => user,
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

async fn list_friend_requests_handler(
    State(state): State<AppState>,
    Query(direction): Query<ReadFriendRequestsDto>,
    actor: ClerkUser,
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

async fn list_friends_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
) -> ApiResponse<Vec<ReadFriendshipWithAvatarDto>> {
    let result = state.friend_service.list_friends(actor.clone()).await;

    let Ok(friends) = result else {
        return ApiResponse::Error {
            message: "No friends found".to_string(),
        };
    };

    let ids = friends
        .iter()
        .cloned()
        .map(|friend| get_other_friend_id(actor.clone().user_id.clone(), friend))
        .collect::<Vec<String>>();

    if ids.is_empty() {
        return ApiResponse::Success { data: vec![] };
    }

    let data = clerk_rs::apis::users_api::User::get_user_list(
        &state.clerk,
        None,
        None,
        None,
        None,
        None,
        Some(ids),
        None,
        None,
        None,
        None,
        None,
    )
    .await;
    let clerk_users = match data {
        Ok(users) => users,
        Err(e) => {
            return ApiResponse::Error {
                message: e.to_string(),
            }
        }
    };

    let mut mapped: Vec<ReadFriendshipWithAvatarDto> = Vec::new();
    for user in clerk_users {
        let user_id = user.id.unwrap_or("".to_string());
        let avatar_url = user.image_url;
        let friendship = friends.iter().find(|friend| {
            get_other_friend_id(actor.clone().user_id.clone(), friend.to_owned().clone()) == user_id
        });

        let friendship = match friendship {
            Some(friendship) => friendship.clone(),
            None => {
                return ApiResponse::Error {
                    message: "Friendship not found".to_string(),
                };
            }
        };
        let friendship_with_avatar = ReadFriendshipWithAvatarDto {
            id: friendship.id,
            created_at: friendship.created_at,
            friend1: ReadUserAvatarDto {
                id: friendship.friend1.id,
                username: friendship.friend1.username,
                avatar_url: avatar_url.clone(),
            },
            friend2: ReadUserAvatarDto {
                id: friendship.friend2.id,
                username: friendship.friend2.username,
                avatar_url: avatar_url.clone(),
            },
        };

        mapped.push(friendship_with_avatar);
    }

    ApiResponse::Success { data: (mapped) }
}

async fn remove_friend_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<RemoveFriendDto>,
) -> ApiResponse<()> {
    let result = state.friend_service.remove_friend(payload, actor).await;
    ApiResponse::from_result(result)
}
