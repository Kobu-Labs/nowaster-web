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
        feed::{CreateFeedEventDto, CreateFeedReactionDto, FeedQueryDto},
        user::read_user::ReadUserDto,
    },
    entity::feed::{FeedEvent, FeedEventSource, FeedEventType, FeedReaction},
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
pub struct FeedSubsriptionRow {
    pub id: Uuid,
    pub created_at: DateTime<Local>,

    pub subscriber_id: String,
    pub source_id: String,

    pub is_muted: bool,
    pub is_paused: bool,
}

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "feed_source_type")]
enum FeedSourceSqlType {
    #[sqlx(rename = "group")]
    Group,
    #[sqlx(rename = "user")]
    User,
    #[sqlx(rename = "system")]
    System,
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
                    })
                } else {
                    return Err(anyhow!(
                        "Source type of 'user' is missing 'user_id' or 'user_name'"
                    ));
                }
            }
            FeedSourceSqlType::Group => {
                return Err(anyhow::anyhow!("Group source type not yet implemented"));
            }
            FeedSourceSqlType::System => {
                return Err(anyhow::anyhow!("System source type not yet implemented"));
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

    pub async fn get_subscriptions(
        &self,
        source: FeedEventSource,
    ) -> Result<Vec<FeedSubsriptionRow>> {
        let (source_id, source_type) = FeedEventMapper::serialize_source(source);

        let results = sqlx::query_as!(
            FeedSubsriptionRow,
            r#"
                SELECT
                    fs.id,
                    fs.created_at,

                    fs.is_muted,
                    fs.is_paused,

                    fs.subscriber_id,

                    fs.source_id
                FROM feed_subscription fs
                WHERE fs.source_type = $1
                    AND fs.source_id = $2
            "#,
            source_type as FeedSourceSqlType,
            source_id
        )
        .fetch_all(self.db.get_pool())
        .await?;

        Ok(results)
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
                },
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
    ) -> Result<()> {
        sqlx::query!(
            r#"
                INSERT INTO feed_reaction (feed_event_id, user_id, emoji)
                VALUES ($1, $2, $3)
                ON CONFLICT (feed_event_id, user_id, emoji) DO NOTHING
            "#,
            dto.feed_event_id,
            actor.user_id,
            dto.emoji
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
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
}
