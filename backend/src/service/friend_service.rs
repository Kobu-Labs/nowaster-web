use anyhow::Result;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, prelude::FromRow, Row};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::user::read_user::ReadUserDto,
    entity::user::User,
    repository::friends::{FriendsRepository, UpdateFriendRequestDto},
    router::clerk::ClerkUser,
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

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadFriendshipWithAvatarDto {
    pub id: Uuid,
    pub friend1: ReadUserAvatarDto,
    pub friend2: ReadUserAvatarDto,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadUserAvatarDto {
    pub id: String,
    pub username: String,
    pub avatar_url: Option<String>,
}

impl From<User> for ReadUserAvatarDto {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            avatar_url: None,
        }
    }
}

impl FromRow<'_, PgRow> for ReadFriendRequestDto {
    fn from_row(row: &PgRow) -> sqlx::Result<Self> {
        let requestor = ReadUserDto {
            id: row.try_get("requestor_id")?,
            username: row.try_get("requestor_username")?,
        };

        let recipient = ReadUserDto {
            id: row.try_get("recipient_id")?,
            username: row.try_get("recipient_username")?,
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
        };

        let friend2 = ReadUserDto {
            id: row.try_get("friend2_id")?,
            username: row.try_get("friend2_username")?,
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

#[derive(Clone)]
pub struct FriendService {
    repo: FriendsRepository,
}

impl FriendService {
    pub fn new(repo: FriendsRepository) -> Self {
        Self { repo }
    }

    pub async fn create_friend_request(
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

    pub async fn accept_friend_request(
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
        Ok(result)
    }

    pub async fn reject_friend_request(
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

    pub async fn cancel_friend_request(
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

    pub async fn list_friends(&self, actor: ClerkUser) -> Result<Vec<ReadFriendshipDto>> {
        let result = self.repo.list_friends(actor.clone()).await?;
        Ok(result)
    }

    pub async fn remove_friend(&self, dto: RemoveFriendDto, actor: ClerkUser) -> Result<()> {
        self.repo.remove_friendship(dto, actor).await?;
        Ok(())
    }

    pub async fn list_friend_requests(
        &self,
        actor: ClerkUser,
        data: ReadFriendRequestsDto,
    ) -> Result<Vec<ReadFriendRequestDto>> {
        let result = self.repo.list_friend_requests(data, actor).await?;
        Ok(result)
    }
}
