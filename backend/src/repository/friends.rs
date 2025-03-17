use std::sync::Arc;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgConnection};
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
    pub request_id: Uuid,
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
        let result = sqlx::query(
            r#"
                SELECT 
                    fr.id, 
                    fr.created_at,
                    fr.introduction_message, 
                    fr.status,

                    u1.displayname AS requestor_username,
                    u1.id AS requestor_id,
                    u2.displayname AS recipient_username,
                    u2.id AS recipient_id
                FROM friend_request fr
                JOIN "user" u1 ON u1.id = requestor_id
                JOIN "user" u2 ON u2.id = recipient_id
                WHERE fr.id = $1 AND (fr.recipient_id = $2 OR fr.requestor_id = $2)
            "#,
        )
        .bind(id)
        .bind(actor.user_id)
        .fetch_one(self.db.get_pool())
        .await?;

        let result = ReadFriendRequestDto::from_row(&result)?;

        Ok(result)
    }

    pub async fn update_friend_request(
        &self,
        dto: UpdateFriendRequestDto,
    ) -> Result<ReadFriendRequestDto> {
        let mut tx = self.db.get_pool().begin().await?;
        let request = sqlx::query(
            r#"
                WITH updated AS (
                    UPDATE friend_request
                    SET 
                        status = $1,
                        updated_at = now(),
                        updated_to_status = $1
                    WHERE id = $2 
                    RETURNING 
                        id, 
                        requestor_id, 
                        recipient_id,
                        created_at,
                        introduction_message,
                        status
                    )
                SELECT
                    u.id, 
                    u.created_at,
                    u.introduction_message, 
                    u.status,

                    u1.displayname AS requestor_username,
                    u1.id AS requestor_id,
                    u2.displayname AS recipient_username,
                    u2.id AS recipient_id
                FROM updated u
                JOIN "user" u1 ON u1.id = u.requestor_id
                JOIN "user" u2 ON u2.id = u.recipient_id
            "#,
        )
        .bind(dto.status)
        .bind(dto.request_id)
        .fetch_one(tx.as_mut())
        .await?;

        let request = ReadFriendRequestDto::from_row(&request)?;

        if request.status == FriendRequestStatus::Accepted {
            self.create_friend_relationship(
                request.requestor.id.clone(),
                request.recipient.id.clone(),
                tx.as_mut(),
            )
            .await?;
        }

        tx.commit().await?;

        Ok(request)
    }

    async fn create_friend_relationship(
        &self,
        requestor_id: String,
        recipient_id: String,
        tx: &mut PgConnection,
    ) -> Result<ReadFriendshipDto> {
        let result = sqlx::query(
            r#"
                WITH inserted as (
                    INSERT INTO friend (friend_1_id, friend_2_id)
                    VALUES ($1, $2)
                    RETURNING id, friend_1_id , friend_2_id , created_at
                )
                SELECT 
                    i.id,
                    i.friend_1_id AS friend1_id,
                    i.friend_2_id AS friend2_id,
                    i.created_at,
                    u1.displayname AS friend1_username,
                    u2.displayname AS friend2_username
                FROM inserted i
                LEFT JOIN "user" u1 ON u1.id = i.friend_1_id
                LEFT JOIN "user" u2 ON u2.id = i.friend_2_id
            "#,
        )
        .bind(requestor_id)
        .bind(recipient_id)
        .fetch_one(tx.as_mut())
        .await?;

        let result = ReadFriendshipDto::from_row(&result)?;

        Ok(result)
    }

    pub async fn list_friends(&self, actor: ClerkUser) -> Result<Vec<ReadFriendshipDto>> {
        let result = sqlx::query(
            r#"
                SELECT 
                    f.id,
                    f.friend_1_id as "friend1_id",
                    f.friend_2_id as "friend2_id", 
                    f.created_at,
                    u1.displayname AS friend1_username,
                    u2.displayname AS friend2_username
                FROM friend f
                LEFT JOIN "user" u1 ON u1.id = f.friend_1_id
                LEFT JOIN "user" u2 ON u2.id = f.friend_2_id
                WHERE (f.friend_1_id = $1 OR f.friend_2_id = $1) AND f.deleted is not true
            "#,
        )
        .bind(actor.user_id)
        .fetch_all(self.db.get_pool())
        .await?;

        let result = result
            .into_iter()
            .map(|row| Ok(ReadFriendshipDto::from_row(&row)?))
            .collect::<Result<Vec<ReadFriendshipDto>>>()?;

        Ok(result)
    }

    pub async fn remove_friendship(
        &self,
        dto: RemoveFriendDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendshipDto> {
        let row = sqlx::query(
            r#"
                WITH deleted AS (
                    UPDATE friend
                    SET deleted = true
                    WHERE id = $1 AND (friend_1_id = $2 OR friend_2_id = $2)
                    RETURNING id, friend_1_id, friend_2_id, created_at
                )
                SELECT 
                    d.id,
                    d.friend_1_id AS friend1_id,
                    d.friend_2_id AS friend2_id,
                    d.created_at,
                    u1.displayname AS friend1_username,
                    u2.displayname AS friend2_username
                FROM deleted d
                LEFT JOIN "user" u1 ON u1.id = d.friend_1_id
                LEFT JOIN "user" u2 ON u2.id = d.friend_2_id
            "#,
        )
        .bind(dto.friendship_id)
        .bind(actor.user_id)
        .fetch_one(self.db.get_pool())
        .await?;

        let result = ReadFriendshipDto::from_row(&row)?;

        Ok(result)
    }

    pub async fn create_friend_request(
        &self,
        data: CreateFriendRequestDto,
        actor: ClerkUser,
    ) -> Result<ReadFriendRequestDto> {
        let mut tx = self.db.get_pool().begin().await?;
        let exising_request = sqlx::query!(
            r#"
                SELECT id
                FROM friend_request
                WHERE 
                    ((requestor_id = $1 AND recipient_id = $2) OR (requestor_id = $2 AND recipient_id = $1))
                    AND status = 'pending'
            "#,
            actor.user_id,
            data.recipient_id
        )
        .fetch_optional(tx.as_mut())
        .await?;

        if exising_request.is_some() {
            return Err(anyhow::anyhow!("Friend request already exists"));
        }

        let exisitng_friend = sqlx::query!(
            r#"
                SELECT id
                FROM friend
                WHERE 
                    ((friend_1_id = $1 AND friend_2_id = $2) OR (friend_1_id = $2 AND friend_2_id = $1))
                    AND deleted is not true
            "#,
            actor.user_id,
            data.recipient_id
        )
        .fetch_optional(tx.as_mut())
        .await?;

        if exisitng_friend.is_some() {
            return Err(anyhow::anyhow!("You are already friends"));
        }

        let result = sqlx::query(
            r#"
                WITH inserted AS (
                    INSERT INTO friend_request (requestor_id, recipient_id, introduction_message)
                    VALUES ($1, $2, $3)
                    RETURNING
                        id,
                        requestor_id,
                        recipient_id,
                        created_at,
                        introduction_message,
                        status
                )
                SELECT 
                    i.id, 
                    i.created_at,
                    i.introduction_message, 
                    i.status,

                    u1.displayname AS requestor_username,
                    u1.id AS requestor_id,
                    u2.displayname AS recipient_username,
                    u2.id AS recipient_id
                FROM inserted i
                JOIN "user" u1 ON u1.id = i.requestor_id
                JOIN "user" u2 ON u2.id = i.recipient_id
            "#,
        )
        .bind(actor.user_id)
        .bind(data.recipient_id)
        .bind(data.introduction_message)
        .fetch_one(tx.as_mut())
        .await?;

        tx.commit().await?;

        let result = ReadFriendRequestDto::from_row(&result)?;

        Ok(result)
    }

    pub async fn list_friend_requests(
        &self,
        data: ReadFriendRequestsDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadFriendRequestDto>> {
        let result = sqlx::query(
            r#"
                SELECT
                    fr.id, 
                    fr.created_at,
                    fr.introduction_message, 
                    fr.status,

                    u1.displayname AS requestor_username,
                    u1.id AS requestor_id,
                    u2.displayname AS recipient_username,
                    u2.id AS recipient_id
                FROM friend_request fr
                JOIN "user" u1 ON u1.id = requestor_id
                JOIN "user" u2 ON u2.id = recipient_id
                WHERE 
                    ((fr.recipient_id = $1 AND $2 = 'incoming') OR (fr.requestor_id = $1 AND $2 = 'outgoing'))
                    AND fr.status = 'pending'
            "#,
        )
            .bind(actor.user_id)
            .bind(data.direction.to_string())
        .fetch_all(self.db.get_pool())
        .await?;

        let result = result
            .into_iter()
            .map(|row| Ok(ReadFriendRequestDto::from_row(&row)?))
            .collect::<Result<Vec<ReadFriendRequestDto>>>()?;

        Ok(result)
    }
}
