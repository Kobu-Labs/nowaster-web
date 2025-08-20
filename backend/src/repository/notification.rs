use chrono::{DateTime, Local};
use serde_json::Value;
use sqlx::{postgres::PgRow, prelude::FromRow, Row};
use std::sync::Arc;
use tracing::instrument;

use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::{
        notification::{CreateNotificationDto, NotificationQueryDto},
        user::read_user::ReadUserDto,
    },
    entity::{
        notification::{
            Notification, NotificationSource, NotificationSourceTypeSql, NotificationType,
            NotificationTypeSql, SystemNotificationData,
        },
        visibility::VisibilityFlags,
    },
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct NotificationRepository {
    db: Arc<Database>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
struct NotificationRowRead {
    pub id: Uuid,
    pub user_id: String,
    pub notification_type: NotificationTypeSql,
    pub source_id: String,
    pub source_type: NotificationSourceTypeSql,
    pub content: Value,
    pub seen: bool,
    pub created_at: DateTime<Local>,

    // Joined user data (for user sources)
    pub source_user_id: Option<String>,
    pub source_user_name: Option<String>,
    pub source_user_avatar_url: Option<String>,
    // Note: group and system source data would be joined here in future
}

impl FromRow<'_, PgRow> for NotificationRowRead {
    fn from_row(row: &PgRow) -> sqlx::Result<Self> {
        Ok(Self {
            id: row.try_get("id")?,
            user_id: row.try_get("user_id")?,
            notification_type: row.try_get("notification_type")?,
            source_id: row.try_get("source_id")?,
            source_type: row.try_get("source_type")?,
            content: row.try_get("content")?,
            seen: row.try_get("seen")?,
            created_at: row.try_get("created_at")?,
            source_user_id: row.try_get("source_user_id")?,
            source_user_name: row.try_get("source_user_name")?,
            source_user_avatar_url: row.try_get("source_user_avatar_url")?,
        })
    }
}

struct NotificationMapper {}

impl NotificationMapper {
    fn map_to_notification(row: NotificationRowRead) -> Result<Notification> {
        let source = match row.source_type {
            NotificationSourceTypeSql::User => {
                if let (Some(user_id), Some(user_name)) = (row.source_user_id, row.source_user_name)
                {
                    NotificationSource::User(ReadUserDto {
                        id: user_id,
                        username: user_name,
                        avatar_url: row.source_user_avatar_url,
                        visibility_flags: VisibilityFlags::default(),
                    })
                } else {
                    return Err(anyhow!(
                        "Source type of 'user' is missing 'source_user_id' or 'source_user_name'"
                    ));
                }
            }

            NotificationSourceTypeSql::System => {
                NotificationSource::System(SystemNotificationData {
                    system_id: row.source_id.clone(),
                    system_name: "Nowaster System".to_string(),
                })
            }
        };

        let notification_type =
            NotificationMapper::deserialize_notification_type(row.notification_type, row.content)?;

        Ok(Notification {
            id: row.id,
            user_id: row.user_id,
            source,
            notification_type,
            seen: row.seen,
            created_at: row.created_at,
        })
    }

    fn serialize_source(source: NotificationSource) -> (String, NotificationSourceTypeSql) {
        match source {
            NotificationSource::User(read_user_dto) => {
                (read_user_dto.id, NotificationSourceTypeSql::User)
            }
            NotificationSource::System(system_data) => {
                (system_data.system_id, NotificationSourceTypeSql::System)
            }
        }
    }

    fn deserialize_notification_type(
        notification_type: NotificationTypeSql,
        content: Value,
    ) -> Result<NotificationType> {
        match notification_type {
            NotificationTypeSql::FriendNewRequest => Ok(NotificationType::FriendNewRequest(
                serde_json::from_value(content)?,
            )),
            NotificationTypeSql::FriendRequestAccepted => Ok(
                NotificationType::FriendRequestAccepted(serde_json::from_value(content)?),
            ),
            NotificationTypeSql::SessionReactionAdded => Ok(
                NotificationType::SessionReactionAdded(serde_json::from_value(content)?),
            ),
            NotificationTypeSql::SystemNewRelease => Ok(NotificationType::SystemNewRelease(
                serde_json::from_value(content)?,
            )),
        }
    }

    fn serialize_notification_type(
        notification_type: NotificationType,
    ) -> Result<(NotificationTypeSql, Value)> {
        match notification_type {
            NotificationType::FriendNewRequest(data) => Ok((
                NotificationTypeSql::FriendNewRequest,
                serde_json::to_value(data)?,
            )),
            NotificationType::FriendRequestAccepted(data) => Ok((
                NotificationTypeSql::FriendRequestAccepted,
                serde_json::to_value(data)?,
            )),
            NotificationType::SessionReactionAdded(data) => Ok((
                NotificationTypeSql::SessionReactionAdded,
                serde_json::to_value(data)?,
            )),
            NotificationType::SystemNewRelease(data) => Ok((
                NotificationTypeSql::SystemNewRelease,
                serde_json::to_value(data)?,
            )),
        }
    }
}

impl NotificationRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn create_notification(&self, dto: CreateNotificationDto) -> Result<Uuid> {
        let (notification_type, content) =
            NotificationMapper::serialize_notification_type(dto.notification_type)?;
        let (source_id, source_type) = NotificationMapper::serialize_source(dto.source);

        let notification_id = Uuid::new_v4();

        sqlx::query!(
            r#"
                INSERT INTO notification (id, user_id, notification_type, source_id, source_type, content)
                VALUES ($1, $2, $3, $4, $5, $6)
            "#,
            notification_id,
            dto.user_id,
            notification_type as NotificationTypeSql,
            source_id,
            source_type as NotificationSourceTypeSql,
            content
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(notification_id)
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn get_notifications(
        &self,
        user_id: String,
        query: NotificationQueryDto,
    ) -> Result<Vec<Notification>> {
        let mut base_query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            SELECT
                n.id,
                n.user_id,
                n.notification_type,
                n.source_id,
                n.source_type,
                n.content,
                n.seen,
                n.created_at,

                u.id as source_user_id,
                u.displayname as source_user_name,
                u.avatar_url as source_user_avatar_url
            FROM notification n
            LEFT JOIN "user" u
                ON u.id = n.source_id
                AND n.source_type = 'user'
            WHERE n.user_id ="#,
        );
        base_query.push_bind(user_id);

        if let Some(seen) = query.seen {
            base_query.push(" AND n.seen = ").push_bind(seen);
        }

        if let Some(cursor) = query.cursor {
            base_query.push(" AND n.created_at < ").push_bind(cursor);
        }

        base_query.push(" ORDER BY n.created_at DESC");

        if let Some(limit) = query.limit {
            base_query.push(" LIMIT ").push_bind(limit);
        }

        let rows = base_query
            .build_query_as::<NotificationRowRead>()
            .fetch_all(self.db.get_pool())
            .await?;

        let notifications = rows
            .into_iter()
            .map(NotificationMapper::map_to_notification)
            .collect::<Result<Vec<_>>>()?;

        Ok(notifications)
    }

    #[instrument(err, skip(self), fields(user_id = %actor.user_id, notification_count = notification_ids.len()))]
    pub async fn mark_notifications_seen(
        &self,
        notification_ids: &[Uuid],
        actor: Actor,
    ) -> Result<u64> {
        if notification_ids.is_empty() {
            return Ok(0);
        }

        let result = sqlx::query!(
            r#"
                UPDATE notification
                SET seen = true
                WHERE id = ANY($1) AND user_id = $2 AND seen = false
            "#,
            notification_ids,
            actor.user_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected())
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn get_unseen_count(&self, user_id: String) -> Result<i64> {
        let result = sqlx::query!(
            r#"
                SELECT COUNT(*) as count
                FROM notification
                WHERE user_id = $1 AND seen = false
            "#,
            user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn get_total_count(&self, user_id: String) -> Result<i64> {
        let result = sqlx::query!(
            r#"
                SELECT COUNT(*) as count
                FROM notification
                WHERE user_id = $1
            "#,
            user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(result.count.unwrap_or(0))
    }

    #[instrument(err, skip(self), fields(notification_id = %notification_id, user_id = %actor.user_id))]
    pub async fn delete_notification(
        &self,
        notification_id: Uuid,
        actor: Actor,
    ) -> Result<bool> {
        let result = sqlx::query!(
            r#"
                DELETE FROM notification
                WHERE id = $1 AND user_id = $2
            "#,
            notification_id,
            actor.user_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Delete all notifications older than the specified date for a user
    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn cleanup_old_notifications(
        &self,
        user_id: String,
        before_date: DateTime<Local>,
    ) -> Result<u64> {
        let result = sqlx::query!(
            r#"
                DELETE FROM notification
                WHERE user_id = $1 AND created_at < $2
            "#,
            user_id,
            before_date
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected())
    }
}

