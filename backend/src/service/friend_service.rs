use anyhow::Result;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, prelude::FromRow, Row};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::{
        feed::{AddFeedSource, RemoveFeedSource},
        user::read_user::ReadUserDto,
    },
    entity::visibility::VisibilityFlags,
    repository::friends::{FriendsRepository, UpdateFriendRequestDto},
    router::clerk::ClerkUser,
    service::feed::{subscriptions::FeedSubscriptionService, visibility::FeedVisibilityService},
};

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadFriendshipAsActorDto {
    pub id: Uuid,
    pub friend: ReadUserDto,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ProcessFriendRequestDto {
    pub recipient_name: String,
    pub introduction_message: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct CreateFriendRequestDto {
    pub recipient_id: String,
    pub introduction_message: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadFriendshipDto {
    pub id: Uuid,
    pub friend1: ReadUserDto,
    pub friend2: ReadUserDto,
    pub created_at: DateTime<Local>,
}

impl FromRow<'_, PgRow> for ReadFriendRequestDto {
    fn from_row(row: &PgRow) -> sqlx::Result<Self> {
        let requestor = ReadUserDto {
            id: row.try_get("requestor_id")?,
            username: row.try_get("requestor_username")?,
            avatar_url: row.try_get("requestor_avatar_url")?,
            visibility_flags: VisibilityFlags::default(), // Default for friend request display
        };

        let recipient = ReadUserDto {
            id: row.try_get("recipient_id")?,
            username: row.try_get("recipient_username")?,
            avatar_url: row.try_get("recipient_avatar_url")?,
            visibility_flags: VisibilityFlags::default(), // Default for friend request display
        };

        let created_at: DateTime<Local> = row.try_get("created_at")?;
        let id: Uuid = row.try_get("id")?;
        let status: FriendRequestStatus = row.try_get("status")?;
        let introduction_message: Option<String> = row.try_get("introduction_message")?;
        Ok(Self {
            id,
            status,
            requestor,
            recipient,
            introduction_message,
            created_at,
        })
    }
}

impl FromRow<'_, PgRow> for ReadFriendshipDto {
    fn from_row(row: &PgRow) -> sqlx::Result<Self> {
        let friend1 = ReadUserDto {
            id: row.try_get("friend1_id")?,
            username: row.try_get("friend1_username")?,
            avatar_url: row.try_get("friend1_avatar_url")?,
            visibility_flags: VisibilityFlags::default(), // Default for friendship display
        };

        let friend2 = ReadUserDto {
            id: row.try_get("friend2_id")?,
            username: row.try_get("friend2_username")?,
            avatar_url: row.try_get("friend2_avatar_url")?,
            visibility_flags: VisibilityFlags::default(), // Default for friendship display
        };

        let created_at: DateTime<Local> = row.try_get("created_at")?;
        let id: Uuid = row.try_get("id")?;
        Ok(Self {
            id,
            friend1,
            friend2,
            created_at,
        })
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct AcceptFriendRequestDto {
    pub request_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct RejectFriendRequestDto {
    pub request_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CancelFriendRequestDto {
    pub request_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct RemoveFriendDto {
    pub friendship_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FriendRequestDirection {
    Incoming,
    Outgoing,
}

impl std::fmt::Display for FriendRequestDirection {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FriendRequestDirection::Incoming => write!(f, "incoming"),
            FriendRequestDirection::Outgoing => write!(f, "outgoing"),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
pub struct SearchUserDto {
    pub query: String,
}

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "friend_request_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum FriendRequestStatus {
    Pending,
    Accepted,
    Rejected,
    Cancelled,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadFriendRequestsDto {
    pub direction: FriendRequestDirection,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadFriendRequestDto {
    pub id: Uuid,
    pub status: FriendRequestStatus,
    pub requestor: ReadUserDto,
    pub recipient: ReadUserDto,
    pub created_at: DateTime<Local>,
    pub introduction_message: Option<String>,
}

#[async_trait::async_trait]
pub trait FriendServiceTrait {
    async fn create_friend_request(
        &self,
        dto: CreateFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto>;

    async fn accept_friend_request(
        &self,
        dto: AcceptFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto>;

    async fn reject_friend_request(
        &self,
        dto: RejectFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto>;

    async fn cancel_friend_request(
        &self,
        dto: CancelFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto>;

    async fn list_friends(&self, actor: ClerkUser) -> Result<Vec<ReadFriendshipDto>>;

    async fn remove_friend(&self, dto: RemoveFriendDto, actor: ClerkUser) -> Result<()>;

    async fn list_friend_requests(
        &self,
        actor: ClerkUser,
        data: ReadFriendRequestsDto,
    ) -> Result<Vec<ReadFriendRequestDto>>;
}

#[derive(Clone)]
pub struct FriendService {
    repo: FriendsRepository,
    visibility_service: FeedVisibilityService,
    subscription_service: FeedSubscriptionService,
}

#[async_trait::async_trait]
impl FriendServiceTrait for FriendService {
    async fn create_friend_request(
        &self,
        dto: CreateFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto> {
        if dto.recipient_id == actor.user_id {
            return Err(anyhow::anyhow!(
                "You cannot send a friend request to yourself"
            ));
        }

        let result = self.repo.create_friend_request(dto, actor).await?;
        Ok(result)
    }

    async fn accept_friend_request(
        &self,
        dto: AcceptFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto> {
        let dto = UpdateFriendRequestDto {
            request_id: dto.request_id,
            status: FriendRequestStatus::Accepted,
        };

        let request = self
            .repo
            .get_friend_request(dto.request_id, actor.clone())
            .await?;

        if request.status != FriendRequestStatus::Pending {
            return Err(anyhow::anyhow!(
                "You cannot accept a friend request that is not pending"
            ));
        }

        if request.recipient.id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to accept this friend request"
            ));
        }

        let result = self.repo.update_friend_request(dto).await?;
        self.subscription_service
            .subscribe(
                AddFeedSource::User(request.requestor.id.clone()),
                ClerkUser {
                    user_id: request.recipient.id.clone(),
                },
            )
            .await;
        self.subscription_service
            .subscribe(
                AddFeedSource::User(request.recipient.id.clone()),
                ClerkUser {
                    user_id: request.requestor.id.clone(),
                },
            )
            .await;

        let friendship_result = self.repo.get_friendship_by_id(result.id).await;
        if let Ok(Some(friendship)) = friendship_result {
            self.visibility_service
                .recalculate_friendship_visibility(friendship)
                .await;
        }

        Ok(result)
    }

    async fn reject_friend_request(
        &self,
        dto: RejectFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto> {
        let dto = UpdateFriendRequestDto {
            request_id: dto.request_id,
            status: FriendRequestStatus::Rejected,
        };

        let request = self
            .repo
            .get_friend_request(dto.request_id, actor.clone())
            .await?;

        if request.status != FriendRequestStatus::Pending {
            return Err(anyhow::anyhow!(
                "You cannot reject a friend request that is not pending"
            ));
        }

        if request.recipient.id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to reject this friend request"
            ));
        }

        let result = self.repo.update_friend_request(dto).await?;
        Ok(result)
    }

    async fn cancel_friend_request(
        &self,
        dto: CancelFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto> {
        let dto = UpdateFriendRequestDto {
            request_id: dto.request_id,
            status: FriendRequestStatus::Cancelled,
        };

        let request = self
            .repo
            .get_friend_request(dto.request_id, actor.clone())
            .await?;

        if request.status != FriendRequestStatus::Pending {
            return Err(anyhow::anyhow!(
                "You cannot cancel a friend request that is not pending"
            ));
        }

        if request.requestor.id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to cancel this friend request"
            ));
        }

        let result = self.repo.update_friend_request(dto).await?;
        Ok(result)
    }

    async fn list_friends(&self, actor: ClerkUser) -> Result<Vec<ReadFriendshipDto>> {
        let result = self.repo.list_friends(actor.clone()).await?;
        Ok(result)
    }

    async fn remove_friend(&self, dto: RemoveFriendDto, actor: ClerkUser) -> Result<()> {
        let friendship = self.repo.remove_friendship(dto, actor.clone()).await?;

        let other_user_id = if friendship.friend1.id == actor.user_id.clone() {
            friendship.clone().friend2.id
        } else {
            friendship.clone().friend1.id
        };

        self.subscription_service
            .unsubscribe(RemoveFeedSource::User(other_user_id), actor.clone())
            .await;
        self.visibility_service
            .recalculate_friendship_visibility(friendship.clone())
            .await;

        Ok(())
    }

    async fn list_friend_requests(
        &self,
        actor: ClerkUser,
        data: ReadFriendRequestsDto,
    ) -> Result<Vec<ReadFriendRequestDto>> {
        let result = self.repo.list_friend_requests(data, actor).await?;
        Ok(result)
    }
}

impl FriendService {
    pub fn new(
        repo: FriendsRepository,
        visibility_service: FeedVisibilityService,
        subscription_service: FeedSubscriptionService,
    ) -> Self {
        FriendService {
            repo,
            visibility_service,
            subscription_service,
        }
    }
}
