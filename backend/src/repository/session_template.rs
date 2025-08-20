use anyhow::Result;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, types::Json, Postgres};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::session::template::{
        CreateRecurringSessionDto, CreateSessionTemplateDto, ReadTemplateShallowDto,
        UpdateSessionTemplateDto,
    },
    entity::session_template::RecurringSessionInterval,
    router::clerk::Actor,
};
use std::sync::Arc;

use super::{category::ReadCategoryRow, tag::ReadTagRow};

#[derive(Clone)]
pub struct RecurringSessionRepository {
    db_conn: Arc<Database>,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct ReadRecurringSessionRow {
    pub id: Uuid,
    pub description: Option<String>,
    pub category: ReadCategoryRow,
    pub tags: Json<Vec<ReadTagRow>>,
    pub start_minute_offset: f64,
    pub end_minute_offset: f64,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct ReadSesionTemplateRow {
    pub id: Uuid,
    pub name: String,
    pub created_at: DateTime<Local>,
    pub start_date: DateTime<Local>,
    pub end_date: DateTime<Local>,
    pub interval: RecurringSessionInterval,
    pub sessions: Json<Vec<ReadRecurringSessionRow>>,
}

impl RecurringSessionRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(user_id = %actor.user_id))]
    pub async fn get_recurring_sessions(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadSesionTemplateRow>> {
        let rows = sqlx::query_as!(
            ReadSesionTemplateRow,
            r#"
            SELECT 
                st.id,
                st.name,
                st.start_date,
                st.end_date,
                st.interval AS "interval!: RecurringSessionInterval",
                st.created_at,

                COALESCE(JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', rs.id,
                        'category', (
                            SELECT JSON_BUILD_OBJECT(
                                'id', c.id,
                                'name', c.name,
                                'created_by', c.created_by,
                                'color', c.color
                            ) 
                        ),
                        'description', rs.description,
                        'start_minute_offset', rs.start_minute_offset,
                        'end_minute_offset', rs.end_minute_offset,
                        'tags', (
                            SELECT COALESCE(JSON_AGG(
                                JSON_BUILD_OBJECT(
                                    'id', t.id,
                                    'label', t.label,
                                    'color', t.color,
                                    'created_by', t.created_by
                                )
                            ) FILTER (WHERE t.id IS NOT NULL), '[]')
                            FROM tag_to_recurring_session ttrc
                            LEFT JOIN tag t ON t.id = ttrc.tag_id
                            WHERE ttrc.session_id = rs.id
                        )
                    )
                ) FILTER (WHERE rs.id IS NOT NULL), '[]') AS "sessions!: Json<Vec<ReadRecurringSessionRow>>"

            FROM session_template st
            LEFT JOIN recurring_session rs ON st.id = rs.template_id
            LEFT JOIN category c on rs.category_id = c.id
            WHERE st.user_id = $1
            GROUP BY st.id, st.name, st.start_date, st.end_date, st.interval, st.created_at
           "#,
            actor.user_id
        ).fetch_all(self.db_conn.get_pool()).await?;

        Ok(rows)
    }

    #[instrument(err, skip(self), fields(template_id = %dto.id, user_id = %actor.user_id))]
    pub async fn update_session_template(
        &self,
        dto: UpdateSessionTemplateDto,
        actor: Actor,
    ) -> Result<()> {
        let mut tx = self.db_conn.get_pool().begin().await?;
        sqlx::query!(
            r#"
            DELETE FROM recurring_session rs
            WHERE rs.template_id = $1 AND user_id = $2
        "#,
            dto.id,
            actor.user_id
        )
        .execute(tx.as_mut())
        .await?;

        sqlx::query!(
            r#"
            UPDATE session_template
            SET name = COALESCE($1, name),
                start_date = COALESCE($2, start_date),
                end_date = COALESCE($3, end_date),
                interval = COALESCE($4, interval)
            WHERE id = $5 AND user_id = $6
            "#,
            dto.name,
            dto.start_date,
            dto.end_date,
            dto.interval as RecurringSessionInterval,
            dto.id,
            actor.user_id
        )
        .execute(tx.as_mut())
        .await?;

        // TODO :rewrite this to a bulk insert
        for session in dto.sessions {
            self.create_recurring_session(session, dto.id, actor.clone(), &mut tx)
                .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(template_id = %template_id, user_id = %actor.user_id))]
    pub async fn create_session_template(
        &self,
        template_id: Uuid,
        dto: CreateSessionTemplateDto,
        actor: Actor,
    ) -> Result<()> {
        let mut tx = self.db_conn.get_pool().begin().await?;
        let template_id: Uuid = sqlx::query_scalar!(
            r#"
            INSERT INTO session_template (name, start_date, end_date, interval, user_id, id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
            "#,
            dto.name,
            dto.start_date,
            dto.end_date,
            dto.interval as RecurringSessionInterval,
            actor.user_id,
            template_id
        )
        .fetch_one(tx.as_mut())
        .await?;

        // TODO :rewrite this to a bulk insert
        for session in dto.sessions {
            self.create_recurring_session(session, template_id, actor.clone(), &mut tx)
                .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    #[instrument(err, skip(self, tx), fields(template_id = %template_id, user_id = %actor.user_id, category_id = %dto.category_id))]
    async fn create_recurring_session(
        &self,
        dto: CreateRecurringSessionDto,
        template_id: Uuid,
        actor: Actor,
        tx: &mut sqlx::Transaction<'_, Postgres>,
    ) -> Result<()> {
        sqlx::query!(
            r#"
                WITH new_session AS (
                  INSERT INTO recurring_session (
                    category_id,
                    description,
                    start_minute_offset,
                    end_minute_offset,
                    template_id,
                    user_id
                  )
                  VALUES ($1, $2, $3, $4, $5, $6)
                  RETURNING id
                )
                INSERT INTO tag_to_recurring_session (tag_id, session_id)
                SELECT tag_id, new_session.id
                FROM new_session, unnest($7::uuid[]) AS tag_id
            "#,
            dto.category_id,
            dto.description,
            dto.start_minute_offset,
            dto.end_minute_offset,
            template_id,
            actor.user_id,
            dto.tag_ids.as_slice()
        )
        .execute(tx.as_mut())
        .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(session_id = %session_id, user_id = %actor.user_id))]
    pub async fn delete_recurring_session(&self, session_id: Uuid, actor: Actor) -> Result<()> {
        sqlx::query!(
            r#"
            DELETE FROM recurring_session
            WHERE id = $1 AND user_id = $2
            "#,
            session_id,
            actor.user_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(template_id = %template_id, user_id = %actor.user_id))]
    pub async fn delete_session_template(&self, template_id: Uuid, actor: Actor) -> Result<()> {
        sqlx::query!(
            r#"
            DELETE FROM session_template
            WHERE id = $1 AND user_id = $2
            "#,
            template_id,
            actor.user_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(template_id = %id))]
    pub async fn find_template_by_id(&self, id: Uuid) -> Result<Option<ReadTemplateShallowDto>> {
        let val = sqlx::query_as!(
            ReadTemplateShallowDto,
            r#"
            SELECT
                s.id,
                s.name,
                s.start_date,
                s.end_date,
                s.interval AS "interval!: RecurringSessionInterval"
            FROM session_template s
            WHERE s.id = $1
            "#,
            id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(val)
    }
}
