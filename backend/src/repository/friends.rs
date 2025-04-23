use std::sync::Arc;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::PgConnection;
use uuid::Uuid;
use validator::Validate;

use crate::{
    config::database::{Database, DatabaseTrait},
    router::clerk::ClerkUser,
    service::friend_service::{
        CreateFriendRequestDto, FriendRequestStatus, ReadFriendRequestDto, ReadFriendRequestsDto,
        ReadFriendshipDto, RemoveFriendDto,
    },
};

#[derive(Clone)]
pub struct FriendsRepository {
    db: Arc<Database>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct UpdateFriendRequestDto {
    pub id: Uuid,
    pub status: FriendRequestStatus,
}

impl FriendsRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db: Arc::clone(db_conn),
        }
    }
    pub async fn get_friend_request(
        &self,
        id: Uuid,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto> {
        let result = sqlx::query_as!(
            ReadFriendRequestDto,
            r#"
                SELECT id, requestor_id, recipient_id, created_at, introduction_message, status as "status: FriendRequestStatus"
                FROM friend_request
                WHERE id = $1 AND (recipient_id = $2 OR requestor_id = $2)
            "#,
            id,
            actor.user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(result)
    }

    pub async fn update_friend_request(
        &self,
        dto: UpdateFriendRequestDto,
    ) -> Result<ReadFriendRequestDto> {
        let mut tx = self.db.get_pool().begin().await?;
        let request = sqlx::query_as!(
            ReadFriendRequestDto,
            r#"
                UPDATE friend_request
                SET status = ($1::text)::friend_request_status
                WHERE id = $2 
                RETURNING id, requestor_id, recipient_id, created_at, introduction_message, status as "status: FriendRequestStatus"
            "#,
            dto.status as FriendRequestStatus,
            dto.id,
        )
        .fetch_one(tx.as_mut())
        .await?;

        if request.status == FriendRequestStatus::Accepted {
            self.create_friend_relationship(
                request.requestor_id.clone(),
                request.recipient_id.clone(),
                tx.as_mut(),
            )
            .await?;
        }

        tx.commit().await?;

        Ok(ReadFriendRequestDto {
            id: request.id,
            status: request.status,
            requestor_id: request.requestor_id,
            recipient_id: request.recipient_id,
            created_at: request.created_at,
            introduction_message: request.introduction_message,
        })
    }

    async fn create_friend_relationship(
        &self,
        requestor_id: String,
        recipient_id: String,
        tx: &mut PgConnection,
    ) -> Result<ReadFriendshipDto> {
        let result = sqlx::query_as!(
            ReadFriendshipDto,
            r#"
                INSERT INTO friend (friend_1_id, friend_2_id)
                VALUES ($1, $2)
                RETURNING id, friend_1_id as "friend1_id", friend_2_id as "friend2_id", created_at
            "#,
            requestor_id,
            recipient_id
        )
        .fetch_one(tx.as_mut())
        .await?;

        Ok(result)
    }

    pub async fn list_friends(&self, actor: ClerkUser) -> Result<Vec<ReadFriendshipDto>> {
        let result = sqlx::query_as!(
            ReadFriendshipDto,
            r#"
                SELECT id, friend_1_id as "friend1_id", friend_2_id as "friend2_id", created_at
                FROM friend
                WHERE friend_1_id = $1 OR friend_2_id = $1
            "#,
            actor.user_id
        )
        .fetch_all(self.db.get_pool())
        .await?;

        Ok(result)
    }

    pub async fn remove_friendship(
        &self,
        dto: RemoveFriendDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendshipDto> {
        let result = sqlx::query_as!(
            ReadFriendshipDto,
            r#"
                DELETE FROM friend
                WHERE id = $1 AND (friend_1_id = $2 OR friend_2_id = $2)
                RETURNING id, friend_1_id as "friend1_id", friend_2_id as "friend2_id", created_at
            "#,
            dto.friendship_id,
            actor.user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(result)
    }

    pub async fn create_friend_request(
        &self,
        data: CreateFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto> {
        let exising_request = sqlx::query!(
            r#"
                SELECT id
                FROM friend_request
                WHERE (requestor_id = $1 AND recipient_id = $2) OR (requestor_id = $2 AND recipient_id = $1)
            "#,
            actor.user_id,
            data.recipient_id
        )
        .fetch_optional(self.db.get_pool())
        .await?;

        if exising_request.is_some() {
            return Err(anyhow::anyhow!("Friend request already exists"));
        }

        let result = sqlx::query_as!(
            ReadFriendRequestDto,
            r#"
                INSERT INTO friend_request (requestor_id, recipient_id, introduction_message)
                VALUES ($1, $2, $3)
                RETURNING id, requestor_id, recipient_id, created_at, introduction_message, status as "status: FriendRequestStatus"
            "#,
            actor.user_id,
            data.recipient_id,
            data.introduction_message
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(result)
    }

    pub async fn list_friend_requests(
        &self,
        data: ReadFriendRequestsDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadFriendRequestDto>> {
        let result = sqlx::query_as!(
            ReadFriendRequestDto,
            r#"
                SELECT id, requestor_id, recipient_id, created_at, introduction_message, status as "status: FriendRequestStatus"
                FROM friend_request
                WHERE (recipient_id = $1 AND $2 = 'incoming') or (requestor_id = $1 AND $2 = 'outgoing') AND status = 'pending'
            "#,
            actor.user_id,
            data.direction.to_string(),
        )
        .fetch_all(self.db.get_pool())
        .await?;

        Ok(result)
    }
}
