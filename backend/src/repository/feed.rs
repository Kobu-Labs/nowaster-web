use chrono::{DateTime, Local};
use serde_json::Value;
use sqlx::{postgres::PgRow, prelude::FromRow, Row};
use std::sync::Arc;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::{
        feed::{
            AddFeedSource, CreateFeedEventDto, CreateFeedReactionDto, FeedQueryDto,
            RemoveFeedSource,
        },
        user::read_user::ReadUserDto,
    },
    entity::{
        feed::{FeedEvent, FeedEventSource, FeedEventType, FeedReaction},
        visibility::VisibilityFlags,
    },
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct FeedRepository {
    db: Arc<Database>,
}

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "feed_event_type")]
enum FeedEventSqlType {
    #[sqlx(rename = "session_completed")]
    SessionCompleted,
}

#[derive(Clone, Debug, Deserialize, Serialize, FromRow)]
pub struct FeedSubscriptionRow {
    pub id: Uuid,
    pub created_at: DateTime<Local>,

    pub subscriber_id: String,
    pub source_id: String,
    pub source_type: FeedSourceSqlType,

    pub is_muted: bool,
    pub is_paused: bool,
}

#[derive(Clone, Debug, PartialEq, PartialOrd, Hash, sqlx::Type, Deserialize, Serialize, Eq)]
#[sqlx(type_name = "feed_source_type")]
pub enum FeedSourceSqlType {
    #[sqlx(rename = "user")]
    #[serde(rename = "user")]
    User,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct FeedRowRead {
    pub id: Uuid,

    pub source_id: String,
    pub source_type: FeedSourceSqlType,

    pub event_data: Value,
    pub event_type: FeedEventSqlType,

    pub user_id: Option<String>,
    pub user_name: Option<String>,
    pub user_avatar_url: Option<String>,

    pub created_at: DateTime<Local>,
}

impl FromRow<'_, PgRow> for FeedRowRead {
    fn from_row(row: &PgRow) -> sqlx::Result<Self> {
        Ok(Self {
            id: row.try_get("id")?,
            created_at: row.try_get("created_at")?,

            source_id: row.try_get("source_id")?,
            source_type: row.try_get("source_type")?,

            event_type: row.try_get("event_type")?,
            event_data: row.try_get("event_data")?,

            user_id: row.try_get("user_id")?,
            user_name: row.try_get("user_name")?,
            user_avatar_url: row.try_get("user_avatar_url")?,
        })
    }
}

struct FeedEventMapper {}

impl FeedEventMapper {
    fn map_to_feed_event(row: FeedRowRead) -> Result<FeedEvent> {
        let source = match row.source_type {
            FeedSourceSqlType::User => {
                if let (Some(user_id), Some(user_name)) = (row.user_id, row.user_name) {
                    FeedEventSource::User(ReadUserDto {
                        id: user_id,
                        username: user_name,
                        avatar_url: row.user_avatar_url,
                        visibility_flags: VisibilityFlags::default(),
                    })
                } else {
                    return Err(anyhow!(
                        "Source type of 'user' is missing 'user_id' or 'user_name'"
                    ));
                }
            }
        };

        let event_data = FeedEventMapper::deserialize_event(row.event_type, row.event_data)?;

        Ok(FeedEvent {
            id: row.id,
            source,
            data: event_data,
            created_at: row.created_at,
        })
    }

    fn serialize_source(source: FeedEventSource) -> (String, FeedSourceSqlType) {
        match source {
            FeedEventSource::User(read_user_dto) => (read_user_dto.id, FeedSourceSqlType::User),
        }
    }

    fn deserialize_event(event_type: FeedEventSqlType, event_data: Value) -> Result<FeedEventType> {
        match event_type {
            FeedEventSqlType::SessionCompleted => Ok(FeedEventType::SessionCompleted(
                serde_json::from_value(event_data)?,
            )),
        }
    }

    fn serialize_event(event: FeedEventType) -> Result<(FeedEventSqlType, Value)> {
        match event {
            FeedEventType::SessionCompleted(session_data) => Ok((
                FeedEventSqlType::SessionCompleted,
                serde_json::to_value(session_data)?,
            )),
        }
    }
}

impl FeedRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db: Arc::clone(db_conn),
        }
    }

    pub async fn unsubscribe(&self, source: RemoveFeedSource, actor: ClerkUser) -> Result<()> {
        let (source_id, source_type) = match source {
            RemoveFeedSource::User(id) => (id, FeedSourceSqlType::User),
        };

        sqlx::query!(
            r#"
                DELETE FROM feed_subscription
                WHERE subscriber_id = $1 AND source_id = $2 AND source_type = $3
            "#,
            actor.user_id,
            source_id,
            source_type as FeedSourceSqlType
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
    }

    pub async fn subscribe(&self, source: AddFeedSource, actor: ClerkUser) -> Result<()> {
        let (source_id, source_type) = match source {
            AddFeedSource::User(id) => (id, FeedSourceSqlType::User),
        };

        sqlx::query!(
            r#"
                INSERT INTO feed_subscription (subscriber_id, source_type, source_id)
                VALUES ($1, $2, $3)
                ON CONFLICT (subscriber_id, source_type, source_id) DO NOTHING
            "#,
            actor.user_id,
            source_type as FeedSourceSqlType,
            source_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
    }

    pub async fn create_feed_event(&self, dto: CreateFeedEventDto) -> Result<()> {
        let (event_type, event_data) = FeedEventMapper::serialize_event(dto.data)?;
        let (source_id, source_type) = FeedEventMapper::serialize_source(dto.source);

        sqlx::query!(
            r#"
                INSERT INTO feed_event (id, event_type, event_data, source_type, source_id)
                VALUES ($1, $2, $3, $4, $5)
            "#,
            dto.id.unwrap_or(Uuid::new_v4()),
            event_type as FeedEventSqlType,
            event_data,
            source_type as FeedSourceSqlType,
            source_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
    }

    pub async fn get_feed(&self, user_id: String, query: FeedQueryDto) -> Result<Vec<FeedEvent>> {
        let mut base_query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            SELECT DISTINCT

                fe.id,
                fe.created_at,

                fe.source_id,
                fe.source_type,

                fe.event_type,
                fe.event_data,

                u.id as user_id,
                u.displayname as user_name,
                u.avatar_url as user_avatar_url
            FROM feed_event fe
            LEFT JOIN "user" u 
                ON u.id = fe.source_id 
                AND fe.source_type = 'user'
            JOIN feed_subscription fs
                ON fs.source_type = fe.source_type
                AND fs.source_id = fe.source_id
                AND fs.subscriber_id ="#,
        );
        base_query.push_bind(user_id.clone());
        base_query.push(" WHERE fs.is_muted IS NOT TRUE AND fs.is_paused IS NOT TRUE");
        base_query.push(" AND fs.is_allowed_by_visibility IS TRUE ");

        if let Some(cursor) = query.cursor {
            base_query.push(" AND fe.created_at < ").push_bind(cursor);
        }

        if let Some(limit) = query.limit {
            base_query
                .push(" ORDER BY fe.created_at DESC LIMIT ")
                .push_bind(limit);
        }

        let rows = base_query
            .build_query_as::<FeedRowRead>()
            .fetch_all(self.db.get_pool())
            .await?;

        let events = rows
            .into_iter()
            .map(FeedEventMapper::map_to_feed_event)
            .collect::<Result<Vec<_>>>()?;

        Ok(events)
    }

    pub async fn get_event_reactions(&self, feed_event_ids: &[Uuid]) -> Result<Vec<FeedReaction>> {
        if feed_event_ids.is_empty() {
            return Ok(vec![]);
        }

        let results = sqlx::query!(
            r#"
                SELECT
                    fr.id,
                    fr.feed_event_id,
                    fr.emoji,
                    fr.created_at,
                    u.id as user_id,
                    u.displayname,
                    u.avatar_url
                FROM feed_reaction fr
                JOIN "user" u on u.id = fr.user_id
                WHERE feed_event_id = ANY($1)
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
                user: ReadUserDto {
                    id: row.user_id,
                    username: row.displayname,
                    avatar_url: row.avatar_url,
                    visibility_flags: VisibilityFlags::default(), // Default for feed display
                },
                emoji: row.emoji,
                created_at: row.created_at.into(),
            })
            .collect();

        Ok(reactions)
    }

    pub async fn get_reaction_by_id(&self, reaction_id: Uuid) -> Result<Option<FeedReaction>> {
        let results = sqlx::query!(
            r#"
                SELECT
                    fr.id,
                    fr.feed_event_id,
                    fr.emoji,
                    fr.created_at,
                    u.id as user_id,
                    u.displayname,
                    u.avatar_url
                FROM feed_reaction fr
                JOIN "user" u on u.id = fr.user_id
                WHERE fr.id = $1
            "#,
            reaction_id
        )
        .fetch_optional(self.db.get_pool())
        .await?;

        let reaction = results.map(|row| FeedReaction {
            id: row.id,
            feed_event_id: row.feed_event_id,
            user: ReadUserDto {
                id: row.user_id,
                username: row.displayname,
                avatar_url: row.avatar_url,
                visibility_flags: VisibilityFlags::default(), // Default for feed display
            },
            emoji: row.emoji,
            created_at: row.created_at.into(),
        });

        Ok(reaction)
    }

    pub async fn create_reaction(
        &self,
        dto: CreateFeedReactionDto,
        actor: ClerkUser,
    ) -> Result<FeedReaction> {
        let id = Uuid::new_v4();
        sqlx::query!(
            r#"
                INSERT INTO feed_reaction (id, feed_event_id, user_id, emoji)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (feed_event_id, user_id, emoji) DO NOTHING
            "#,
            id,
            dto.feed_event_id,
            actor.user_id,
            dto.emoji
        )
        .execute(self.db.get_pool())
        .await?;

        let data = self
            .get_reaction_by_id(id)
            .await?
            .ok_or(anyhow!("Not found"))?;

        Ok(data)
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

    pub async fn get_user_subscriptions(
        &self,
        user_id: String,
    ) -> Result<Vec<FeedSubscriptionRow>> {
        let results = sqlx::query_as!(
            FeedSubscriptionRow,
            r#"
                SELECT
                    fs.id,
                    fs.created_at,
                    fs.source_id,
                    fs.source_type as "source_type!: FeedSourceSqlType",
                    fs.is_muted,
                    fs.is_paused,
                    fs.subscriber_id
                FROM feed_subscription fs
                WHERE fs.subscriber_id = $1
                ORDER BY fs.created_at DESC
            "#,
            user_id
        )
        .fetch_all(self.db.get_pool())
        .await?;

        Ok(results)
    }

    pub async fn update_subscription(
        &self,
        subscription_id: Uuid,
        user_id: String,
        is_muted: Option<bool>,
        is_paused: Option<bool>,
    ) -> Result<()> {
        // Build dynamic query based on provided fields
        let mut query_parts = Vec::new();
        let mut param_index = 3; // Start from $3 since $1 and $2 are subscription_id and user_id

        if is_muted.is_some() {
            query_parts.push(format!("is_muted = ${}", param_index));
            param_index += 1;
        }

        if is_paused.is_some() {
            query_parts.push(format!("is_paused = ${}", param_index));
        }

        if query_parts.is_empty() {
            return Ok(()); // Nothing to update
        }

        let query_str = format!(
            "UPDATE feed_subscription SET {} WHERE id = $1 AND subscriber_id = $2",
            query_parts.join(", ")
        );

        let mut query = sqlx::query(&query_str);
        query = query.bind(subscription_id).bind(user_id);

        if let Some(muted) = is_muted {
            query = query.bind(muted);
        }
        if let Some(paused) = is_paused {
            query = query.bind(paused);
        }

        query.execute(self.db.get_pool()).await?;
        Ok(())
    }

    /// Recalculates visibility permissions for a specific user
    /// Call this when a user changes their visibility settings or creates new relationships
    pub async fn recalculate_visibility(&self, user_id: String) -> Result<u64> {
        let affected_rows = sqlx::query!(
            r#"
                UPDATE feed_subscription fs
                SET is_allowed_by_visibility =
                    (
                        -- Allow if source user's visibility is public
                        ((u.visibility_flags & 3) = 3)

                        OR

                        -- Allow if source user's visibility includes friends AND they are friends
                        (
                            (u.visibility_flags & 1) = 1
                            AND EXISTS (
                                SELECT 1
                                FROM friend f
                                WHERE (
                                          (f.friend_1_id = fs.subscriber_id AND f.friend_2_id = fs.source_id)
                                       OR (f.friend_2_id = fs.subscriber_id AND f.friend_1_id = fs.source_id)
                                      )
                                  AND f.deleted = false
                            )
                        )

                        OR

                        -- Allow if subscriber is viewing their own content
                        (fs.subscriber_id = fs.source_id)
                    )
                FROM "user" u
                WHERE fs.source_type = 'user'
                  AND fs.source_id = $1
                  AND u.id = fs.source_id;

            "#,
            user_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(affected_rows.rows_affected())
    }

    pub async fn get_feed_event_by_id(&self, feed_event_id: Uuid) -> Result<Option<FeedEvent>> {
        let mut base_query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            SELECT 
                fe.id,
                fe.created_at,

                fe.source_id,
                fe.source_type,

                fe.event_type,
                fe.event_data,

                u.id as user_id,
                u.displayname as user_name,
                u.avatar_url as user_avatar_url
            FROM feed_event fe
            LEFT JOIN "user" u 
                ON u.id = fe.source_id 
                AND fe.source_type = 'user'
            WHERE fe.id = "#,
        );
        base_query.push_bind(feed_event_id);

        let row = base_query
            .build_query_as::<FeedRowRead>()
            .fetch_optional(self.db.get_pool())
            .await?;

        let result = match row {
            Some(event) => Some(FeedEventMapper::map_to_feed_event(event)?),
            None => None,
        };

        Ok(result)
    }
}
