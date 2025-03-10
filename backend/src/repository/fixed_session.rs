use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgRow, prelude::FromRow, Postgres, QueryBuilder, Row};
use std::{collections::HashMap, sync::Arc, vec};
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::session::{
        filter_session::{FilterSessionDto, Mode},
        fixed_session::CreateFixedSessionDto,
    },
    entity::{category::Category, session::FixedSession, tag::Tag},
};

#[derive(Clone)]
pub struct FixedSessionRepository {
    db_conn: Arc<Database>,
}

pub trait SessionRepositoryTrait {
    async fn delete_session(&self, id: Uuid) -> Result<()>;
    async fn filter_sessions(&self, dto: FilterSessionDto) -> Result<Vec<Self::SessionType>>;
    type SessionType;
    fn new(db_conn: &Arc<Database>) -> Self;
    fn convert(&self, val: Vec<GenericFullRowSession>) -> Result<Vec<Self::SessionType>>;
    async fn find_by_id(&self, id: Uuid) -> Result<Vec<Self::SessionType>>;
    async fn create(
        &self,
        dto: CreateFixedSessionDto,
        category_id: Uuid,
        tag_ids: Vec<Uuid>,
    ) -> Result<FixedSession>;
}

#[derive(Clone, Serialize, Deserialize, FromRow)]
pub struct GenericFullRowSession {
    pub id: Uuid,
    start_time: DateTime<Utc>,
    end_time: Option<DateTime<Utc>>,
    session_type: String,
    description: Option<String>,

    category_id: Uuid,
    category: String,

    tag_id: Option<Uuid>,
    tag_label: Option<String>,
}

fn map_read_to_session(row: &PgRow) -> Result<GenericFullRowSession> {
    Ok(GenericFullRowSession {
        id: row.try_get("id")?,
        start_time: row.try_get("start_time")?,
        end_time: row.try_get("end_time")?,
        session_type: row.try_get("session_type")?,
        description: row.try_get("description")?,
        category_id: row.try_get("category_id")?,
        category: row.try_get("category")?,
        tag_id: row.try_get("tag_id")?,
        tag_label: row.try_get("tag_label")?,
    })
}

impl SessionRepositoryTrait for FixedSessionRepository {
    type SessionType = FixedSession;

    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    fn convert(&self, sessions: Vec<GenericFullRowSession>) -> Result<Vec<Self::SessionType>> {
        let mut grouped_tags: HashMap<Uuid, FixedSession> = HashMap::new();
        for session in sessions {
            if session.session_type != "fixed" {
                return Err(anyhow!("Fixed session must have 'fixed' session type"));
            }

            let entry = grouped_tags.entry(session.id).or_insert(FixedSession {
                id: session.id,
                category: Category {
                    id: session.category_id,
                    name: session.category,
                },
                tags: vec![],
                start_time: DateTime::from(session.start_time),
                end_time: DateTime::from(session.end_time.unwrap()), // INFO: fixed sessions cannot have nullable end_time
                description: session.description,
            });

            if let (Some(id), Some(label)) = (session.tag_id, session.tag_label) {
                entry.tags.push(Tag { id, label });
            }
        }
        Ok(grouped_tags.into_values().collect())
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Vec<Self::SessionType>> {
        let sessions = sqlx::query_as!(
            GenericFullRowSession,
            r#"SELECT 
                s.id,
                s.start_time,
                s.description,
                s.end_time,
                s.type as session_type,

                s.category_id,
                c.name as category,

                t.id as "tag_id?",
                t.label as "tag_label?"
            FROM session s
            JOIN category c
                on c.id = s.category_id
            LEFT JOIN tag_to_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            WHERE 
                s.id = $1
                AND type = 'fixed'"#,
            id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        self.convert(sessions)
    }

    async fn create(
        &self,
        dto: CreateFixedSessionDto,
        category_id: Uuid,
        tag_ids: Vec<Uuid>,
    ) -> Result<FixedSession> {
        let result = sqlx::query!(
            r#"
                INSERT INTO session (category_id, type, start_time, end_time, description)
                VALUES ($1, $2,$3,$4,$5)
                RETURNING session.id
            "#,
            category_id,
            String::from("fixed"),
            dto.start_time,
            dto.end_time,
            dto.description
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        // INFO: pair tags with created session
        for tag_id in tag_ids {
            sqlx::query!(
                r#"
                    INSERT INTO tag_to_session (tag_id, session_id)
                    VALUES ($1, $2)
                "#,
                tag_id,
                result.id
            )
            .execute(self.db_conn.get_pool())
            .await?;
        }

        let session = self.find_by_id(result.id).await?;
        match session.first().cloned() {
            Some(val) => Ok(val),
            None => Err(anyhow!("Error creating the session")),
        }
    }

    async fn filter_sessions(&self, dto: FilterSessionDto) -> Result<Vec<Self::SessionType>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"SELECT 
                s.id,
                s.start_time,
                s.description,
                s.end_time,
                s.type as session_type,

                s.category_id,
                c.name as category,

                t.id as tag_id,
                t.label as tag_label
            FROM session s
            JOIN category c
                on c.id = s.category_id
            LEFT JOIN tag_to_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            WHERE 
                1=1"#,
        );

        if let Some(from_endtime) = dto.from_end_time {
            query
                .push(" and s.end_time >= ")
                .push_bind(from_endtime.value);
        }

        if let Some(to_endtime) = dto.to_end_time {
            query
                .push(" and s.end_time <= ")
                .push_bind(to_endtime.value);
        }

        if let Some(from_starttime) = dto.from_start_time {
            query
                .push(" and s.start_time >= ")
                .push_bind(from_starttime.value);
        }

        if let Some(to_starttime) = dto.to_start_time {
            query
                .push(" and s.start_time <= ")
                .push_bind(to_starttime.value);
        }

        let rows = query
            .build_query_as::<GenericFullRowSession>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        let mut sessions = self.convert(rows)?;

        // TODO: these filterings should be done on database level
        if let Some(tag_filter) = dto.tags {
            if let Some(label_filter) = tag_filter.label {
                match label_filter.mode {
                    Mode::All => {
                        sessions.retain(|session| {
                            label_filter
                                .value
                                .iter()
                                .all(|val| session.tags.iter().any(|t| t.label.eq(val)))
                        });
                    }
                    Mode::Some => {
                        sessions.retain(|session| {
                            !session.tags.is_empty()
                                && label_filter.value.iter().any(|name| {
                                    session.tags.iter().any(|tag| tag.label.contains(name))
                                })
                        });
                    }
                }
            }

            if let Some(id_filter) = tag_filter.id {
                match id_filter.mode {
                    Mode::All => {
                        sessions.retain(|session| {
                            id_filter
                                .value
                                .iter()
                                .all(|val| session.tags.iter().any(|t| t.id.eq(val)))
                        });
                    }
                    Mode::Some => {
                        sessions.retain(|session| {
                            !session.tags.is_empty()
                                && id_filter
                                    .value
                                    .iter()
                                    .any(|id| session.tags.iter().any(|tag| tag.id.eq(id)))
                        });
                    }
                }
            }
        }

        if let Some(category_filter) = dto.categories {
            if let Some(name_filter) = category_filter.name {
                match name_filter.mode {
                    Mode::All => {
                        sessions
                            .retain(|session| name_filter.value.contains(&session.category.name));
                    }
                    Mode::Some => {
                        sessions.retain(|session| {
                            name_filter
                                .value
                                .iter()
                                .any(|name| session.category.name.contains(name))
                        });
                    }
                }

                if let Some(id_filter) = category_filter.id {
                    match id_filter.mode {
                        Mode::All => {
                            sessions
                                .retain(|session| id_filter.value.contains(&session.category.id));
                        }
                        Mode::Some => {
                            sessions.retain(|session| {
                                id_filter.value.iter().any(|id| session.category.id.eq(id))
                            });
                        }
                    }
                }
            }
        }
        Ok(sessions)
    }

    async fn delete_session(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM session
                WHERE session.id = $1
            "#,
            id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }
}
