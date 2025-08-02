use std::sync::Arc;

use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::feed::{CreateFeedEventDto, CreateFeedReactionDto, FeedQueryDto},
    entity::feed::{FeedEvent, FeedEventType, FeedReaction, SessionEventData},
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct FeedRepository {
    db: Arc<Database>,
}

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "feed_event_type")]
pub enum FeedEventTypeSql {
    #[sqlx(rename = "session_completed")]
    SessionCompleted,
}

impl FeedRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db: Arc::clone(db_conn),
        }
    }

    pub async fn create_feed_event(&self, dto: CreateFeedEventDto) -> Result<FeedEvent> {
        // Serialize the event enum to store in database
        let (event_type_str, event_data_json) = match &dto.event.data {
            FeedEventType::SessionCompleted(session_data) => (
                FeedEventTypeSql::SessionCompleted,
                serde_json::to_value(session_data)?,
            ),
        };

        let result = sqlx::query!(
            r#"
                INSERT INTO feed_event (user_id, event_type, event_data)
                VALUES ($1, $2, $3)
                RETURNING id, user_id, event_type as "event_type!: FeedEventTypeSql", event_data, created_at
            "#,
            dto.user_id,
            event_type_str as FeedEventTypeSql,
            event_data_json
        )
        .fetch_one(self.db.get_pool())
        .await?;

        // Reconstruct the type-safe enum from database data
        let feed_event_type = match result.event_type {
            FeedEventTypeSql::SessionCompleted => {
                let session_data: SessionEventData = serde_json::from_value(result.event_data)?;
                FeedEventType::SessionCompleted(session_data)
            }
        };

        Ok(FeedEvent {
            id: result.id,
            user_id: result.user_id,
            data: feed_event_type,
            created_at: result.created_at.into(),
        })
    }

    pub async fn get_friends_feed(
        &self,
        user_id: String,
        query: FeedQueryDto,
    ) -> Result<Vec<FeedEvent>> {
        let mut base_query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            SELECT DISTINCT
                fe.id,
                fe.user_id,
                fe.event_type as "fe.event_type!: FeedEventTypeSql",
                fe.event_data,
                fe.created_at
            FROM feed_event fe
            JOIN friend f ON (
                (f.friend_1_id = "#,
        );

        base_query.push_bind(user_id.clone());
        base_query.push(" AND f.friend_2_id = fe.user_id) OR (f.friend_2_id = ");
        base_query.push_bind(user_id.clone());
        base_query.push(" AND f.friend_1_id = fe.user_id))");
        // 👇 Add OR condition for user’s own events
        base_query.push(" OR fe.user_id = ");
        base_query.push_bind(user_id);

        base_query.push(" WHERE f.deleted IS NOT TRUE ");

        if let Some(cursor) = query.cursor {
            base_query.push(" AND fe.created_at < ").push_bind(cursor);
        }

        if let Some(limit) = query.limit {
            base_query
                .push(" ORDER BY fe.created_at DESC LIMIT ")
                .push_bind(limit);
        }

        let rows = base_query
            .build_query_as::<(
                uuid::Uuid,
                String,
                FeedEventTypeSql,
                serde_json::Value,
                chrono::DateTime<chrono::Utc>,
            )>()
            .fetch_all(self.db.get_pool())
            .await?;

        let events = rows
            .into_iter()
            .map(|(id, user_id, event_type_str, event_data, created_at)| {
                // Reconstruct the type-safe enum from database data
                let feed_event_type = match event_type_str {
                    FeedEventTypeSql::SessionCompleted => {
                        let session_data: SessionEventData = serde_json::from_value(event_data)
                            .unwrap_or_else(|_| panic!("Failed to deserialize session data"));
                        FeedEventType::SessionCompleted(session_data)
                    }
                };

                FeedEvent {
                    id,
                    user_id,
                    data: feed_event_type,
                    created_at: created_at.into(),
                }
            })
            .collect();

        Ok(events)
    }

    pub async fn get_feed_reactions(&self, feed_event_ids: &[Uuid]) -> Result<Vec<FeedReaction>> {
        if feed_event_ids.is_empty() {
            return Ok(vec![]);
        }

        let results = sqlx::query!(
            r#"
                SELECT
                    id,
                    feed_event_id,
                    user_id,
                    emoji,
                    created_at
                FROM feed_reaction
                WHERE feed_event_id = ANY($1)
                ORDER BY created_at ASC
            "#,
            feed_event_ids
        )
        .fetch_all(self.db.get_pool())
        .await?;

        let reactions = results
            .into_iter()
            .map(|row| FeedReaction {
                id: row.id,
                feed_event_id: row.feed_event_id,
                user_id: row.user_id,
                emoji: row.emoji,
                created_at: row.created_at.into(),
            })
            .collect();

        Ok(reactions)
    }

    pub async fn create_reaction(
        &self,
        dto: CreateFeedReactionDto,
        actor: ClerkUser,
    ) -> Result<FeedReaction> {
        let result = sqlx::query!(
            r#"
                INSERT INTO feed_reaction (feed_event_id, user_id, emoji)
                VALUES ($1, $2, $3)
                ON CONFLICT (feed_event_id, user_id, emoji) DO NOTHING
                RETURNING id, feed_event_id, user_id, emoji, created_at
            "#,
            dto.feed_event_id,
            actor.user_id,
            dto.emoji
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(FeedReaction {
            id: result.id,
            feed_event_id: result.feed_event_id,
            user_id: result.user_id,
            emoji: result.emoji,
            created_at: result.created_at.into(),
        })
    }

    pub async fn remove_reaction(
        &self,
        feed_event_id: Uuid,
        emoji: String,
        actor: ClerkUser,
    ) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM feed_reaction
                WHERE feed_event_id = $1 AND user_id = $2 AND emoji = $3
            "#,
            feed_event_id,
            actor.user_id,
            emoji
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
    }

    pub async fn get_user_reactions_for_events(
        &self,
        feed_event_ids: &[Uuid],
        user_id: String,
    ) -> Result<Vec<(Uuid, String)>> {
        if feed_event_ids.is_empty() {
            return Ok(vec![]);
        }

        let results = sqlx::query!(
            r#"
                SELECT feed_event_id, emoji
                FROM feed_reaction
                WHERE feed_event_id = ANY($1) AND user_id = $2
            "#,
            feed_event_ids,
            user_id
        )
        .fetch_all(self.db.get_pool())
        .await?;

        let user_reactions = results
            .into_iter()
            .map(|row| (row.feed_event_id, row.emoji))
            .collect();

        Ok(user_reactions)
    }
}
