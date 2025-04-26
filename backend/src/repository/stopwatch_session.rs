use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::session::stopwatch_session::{CreateStopwatchSessionDto, UpdateStopwatchSessionDto},
    entity::{
        category::Category,
        session::{SessionType, StopwatchSession},
        tag::Tag,
        user::User,
    },
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct StopwatchSessionRepository {
    db_conn: Arc<Database>,
}

#[derive(Clone, Serialize, Deserialize, FromRow)]
pub struct StopwatchFullRow {
    pub id: Uuid,

    pub user_id: String,
    pub user_name: String,

    start_time: DateTime<Utc>,
    session_type: SessionType,
    description: Option<String>,

    category_id: Option<Uuid>,
    category_name: Option<String>,
    category_color: Option<String>,

    tag_id: Option<Uuid>,
    tag_label: Option<String>,
    tag_color: Option<String>,
}

impl StopwatchSessionRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    fn convert(&self, sessions: Vec<StopwatchFullRow>) -> Result<Vec<StopwatchSession>> {
        let mut grouped_tags: IndexMap<Uuid, StopwatchSession> = IndexMap::new();
        for session in sessions {
            if session.session_type != SessionType::StopwatchSession {
                return Err(anyhow!(
                    "Stopwatch session must have 'stopwatch' session type"
                ));
            }

            let entry = grouped_tags.entry(session.id).or_insert(StopwatchSession {
                id: session.id,
                user: User {
                    id: session.user_id.clone(),
                    username: session.user_name.clone(),
                },
                category: None,
                tags: None,
                start_time: DateTime::from(session.start_time),
                description: session.description,
            });

            if let (Some(id), Some(label), Some(tag_color)) =
                (session.tag_id, session.tag_label, session.tag_color)
            {
                let tags = entry.tags.get_or_insert_with(Vec::new);
                tags.push(Tag {
                    id,
                    label,
                    color: tag_color,
                });
            }

            if let (Some(id), Some(name), Some(color)) = (
                session.category_id,
                session.category_name,
                session.category_color,
            ) {
                entry.category = Some(Category {
                    id,
                    name,
                    color,
                    created_by: session.user_id.clone(),
                });
            }
        }
        Ok(grouped_tags.into_values().collect())
    }

    pub async fn create(
        &self,
        dto: CreateStopwatchSessionDto,
        category_id: Option<Uuid>,
        tag_ids: Option<Vec<Uuid>>,
        actor: ClerkUser,
    ) -> Result<StopwatchSession> {
        let mut tx = self.db_conn.get_pool().begin().await?;
        let result = sqlx::query!(
            r#"
                INSERT INTO stopwatch_session (category_id, start_time, description, user_id)
                VALUES ($1, $2, $3, $4)
                RETURNING stopwatch_session.id
            "#,
            category_id,
            dto.start_time,
            dto.description,
            actor.user_id
        )
        .fetch_one(tx.as_mut())
        .await?;

        if let Some(tags) = tag_ids {
            // TODO: insert many at once
            for tag_id in tags {
                sqlx::query!(
                    r#"
                        INSERT INTO tag_to_stopwatch_session (tag_id, session_id)
                        VALUES ($1, $2)
                    "#,
                    result.id,
                    tag_id,
                )
                .execute(tx.as_mut())
                .await?;
            }
        }
        tx.commit().await?;

        let session = self.read_stopwatch(actor.clone()).await?;

        match session {
            Some(session) => Ok(session),
            None => Err(anyhow!("Failed to create stopwatch session")),
        }
    }

    // INFO: only one stopwatch session can be active at a time
    pub async fn read_stopwatch(&self, actor: ClerkUser) -> Result<Option<StopwatchSession>> {
        let sessions = sqlx::query_as!(
            StopwatchFullRow,
            r#"SELECT 
                s.id,

                s.user_id,
                u.displayname as user_name,

                s.start_time,
                s.description,
                s.type as session_type,

                s.category_id as "category_id?",
                c.name as "category_name?",
                c.color as "category_color?",

                t.id as "tag_id?",
                t.label as "tag_label?",
                t.color as "tag_color?"
            FROM stopwatch_session s
            INNER JOIN "user" u
                on u.id = s.user_id
            LEFT JOIN category c
                on c.id = s.category_id
            LEFT JOIN tag_to_stopwatch_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            WHERE 
                s.user_id = $1"#,
            actor.user_id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        let result = self.convert(sessions)?;
        Ok(result.first().cloned())
    }

    pub async fn delete_session(&self, id: Uuid, actor: ClerkUser) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM stopwatch_session s
                WHERE s.id = $1 and s.user_id = $2
            "#,
            id,
            actor.user_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    pub async fn update_session(
        &self,
        dto: UpdateStopwatchSessionDto,
        actor: ClerkUser,
    ) -> Result<StopwatchSession> {
        let mut tx = self.db_conn.get_pool().begin().await?;
        sqlx::query(
            r#"
                UPDATE "stopwatch_session" s SET
                    description = COALESCE($1, s.description),
                    start_time = COALESCE($2, s.start_time),
                    category_id = COALESCE($3, s.category_id)
                WHERE s.id = $4
            "#,
        )
        .bind(dto.description)
        .bind(dto.start_time)
        .bind(dto.category_id)
        .bind(dto.id)
        .execute(tx.as_mut())
        .await?;

        println!("Tags: {:?}", dto.tag_ids);
        if let Some(tags) = dto.tag_ids {
            sqlx::query!(
                r#"
                DELETE FROM tag_to_stopwatch_session
                WHERE session_id = $1
            "#,
                dto.id
            )
            .execute(tx.as_mut())
            .await?;

            let query = r#"
                    INSERT INTO tag_to_stopwatch_session (session_id, tag_id)
                    SELECT $1, tag_id FROM UNNEST($2::uuid[]) AS tag_id
                "#;

            sqlx::query(query)
                .bind(dto.id)
                .bind(tags)
                .execute(tx.as_mut())
                .await?;
        }
        tx.commit().await?;

        let session = self.read_stopwatch(actor.clone()).await;
        match session {
            Ok(Some(session)) => Ok(session),
            Ok(None) => Err(anyhow!("Failed to update stopwatch session")),
            Err(e) => Err(e),
        }
    }
}
