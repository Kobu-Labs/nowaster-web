use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Postgres, QueryBuilder};
use std::{sync::Arc, vec};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::session::{
        filter_session::{FilterSessionDto, Mode},
        fixed_session::{
            CreateFixedSessionDto, CreateFixedSessionDtoWithId, UpdateFixedSessionDto,
        },
        template::ReadTemplateShallowDto,
    },
    entity::{
        category::Category, session::FixedSession, session_template::RecurringSessionInterval,
        tag::Tag,
    },
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct FixedSessionRepository {
    db_conn: Arc<Database>,
}

pub trait SessionRepositoryTrait {
    async fn group_sessions(
        &self,
        dto: FilterSessionDto,
        group: GroupingOption,
        aggregate: AggregatingOptions,
        actor: Actor,
    ) -> Result<Vec<GroupedResult>>;
    async fn create_many(&self, dto: Vec<CreateFixedSessionDto>, actor: Actor) -> Result<()>;
    async fn update_session(
        &self,
        dto: UpdateFixedSessionDto,
        actor: Actor,
    ) -> Result<Self::SessionType>;
    async fn delete_session(&self, id: Uuid, actor: Actor) -> Result<()>;
    async fn delete_sessions_by_filter(&self, dto: FilterSessionDto, actor: Actor) -> Result<u64>;
    async fn filter_sessions(
        &self,
        dto: FilterSessionDto,
        actor: Actor,
    ) -> Result<Vec<Self::SessionType>>;
    type SessionType;
    fn new(db_conn: &Arc<Database>) -> Self;
    fn convert(&self, val: Vec<GenericFullRowSession>) -> Result<Vec<Self::SessionType>>;
    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Option<Self::SessionType>>;
    async fn find_by_id_admin(&self, id: Uuid) -> Result<Option<Self::SessionType>>;
    async fn create(&self, dto: CreateFixedSessionDto, actor: Actor) -> Result<FixedSession>;
}

#[derive(Clone, Serialize, Deserialize, FromRow)]
pub struct GenericFullRowSession {
    pub id: Uuid,
    pub user_id: String,
    start_time: DateTime<Utc>,
    end_time: Option<DateTime<Utc>>,
    session_type: String,
    description: Option<String>,

    category_id: Uuid,
    category: String,
    category_color: String,
    category_last_used_at: DateTime<Utc>,

    tag_id: Option<Uuid>,
    tag_label: Option<String>,
    tag_color: Option<String>,
    tag_last_used_at: Option<DateTime<Utc>>,

    template_id: Option<Uuid>,
    template_name: Option<String>,
    template_start_date: Option<DateTime<Utc>>,
    template_end_date: Option<DateTime<Utc>>,
    template_interval: Option<RecurringSessionInterval>,
}

impl SessionRepositoryTrait for FixedSessionRepository {
    type SessionType = FixedSession;

    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    fn convert(&self, sessions: Vec<GenericFullRowSession>) -> Result<Vec<Self::SessionType>> {
        let mut grouped_tags: IndexMap<Uuid, FixedSession> = IndexMap::new();
        for session in sessions {
            if session.session_type != "fixed" {
                return Err(anyhow!("Fixed session must have 'fixed' session type"));
            }

            let entry = grouped_tags.entry(session.id).or_insert(FixedSession {
                id: session.id,
                user_id: session.user_id.clone(),
                category: Category {
                    id: session.category_id,
                    last_used_at: session.category_last_used_at.into(),
                    name: session.category,
                    created_by: session.user_id,
                    color: session.category_color,
                },
                tags: vec![],
                start_time: DateTime::from(session.start_time),
                end_time: DateTime::from(session.end_time.unwrap()), // INFO: fixed sessions cannot have nullable end_time
                description: session.description,
                template: None,
            });

            if let (
                Some(template_id),
                Some(template_name),
                Some(template_start_date),
                Some(template_end_date),
                Some(template_interval),
            ) = (
                session.template_id,
                session.template_name,
                session.template_start_date,
                session.template_end_date,
                session.template_interval,
            ) {
                entry.template = Some(ReadTemplateShallowDto {
                    id: template_id,
                    name: template_name,
                    start_date: template_start_date,
                    end_date: template_end_date,
                    interval: template_interval,
                })
            }

            if let (Some(id), Some(label), Some(tag_color)) =
                (session.tag_id, session.tag_label, session.tag_color)
            {
                entry.tags.push(Tag {
                    id,
                    label,
                    color: tag_color,
                });
            }
        }
        Ok(grouped_tags.into_values().collect())
    }

    #[instrument(err, skip(self), fields(id = %id, user_id = %actor.user_id))]
    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Option<Self::SessionType>> {
        let sessions = sqlx::query_as!(
            GenericFullRowSession,
            r#"SELECT 
                s.id,
                s.user_id as "user_id!",
                s.start_time,
                s.description,
                s.end_time,
                s.type as session_type,

                s.category_id,
                c.name as category,
                c.color as category_color,
                c.last_used_at as category_last_used_at,

                t.id as "tag_id?",
                t.label as "tag_label?",
                t.color as "tag_color?",
                t.last_used_at as "tag_last_used_at?",

                st.id as "template_id?",
                st.name as "template_name?",
                st.start_date as "template_start_date?",
                st.end_date as "template_end_date?",
                st.interval AS "template_interval?: RecurringSessionInterval"
            FROM session s
            JOIN category c
                on c.id = s.category_id
            LEFT JOIN tag_to_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            LEFT JOIN session_template st
                on st.id = s.template_id
            WHERE 
                s.id = $1
                AND type = 'fixed' 
                AND s.user_id = $2"#,
            id,
            actor.user_id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        let result = self.convert(sessions)?;
        match result.first() {
            Some(val) => Ok(Some(val.clone())),
            None => Ok(None),
        }
    }

    #[instrument(err, skip(self), fields(user_id = %actor.user_id, session_count = dtos.len()))]
    async fn create_many(&self, dtos: Vec<CreateFixedSessionDto>, actor: Actor) -> Result<()> {
        let sessions: Vec<CreateFixedSessionDtoWithId> =
            dtos.iter().cloned().map(Into::into).collect();

        let mut tx = self.db_conn.get_pool().begin().await?;
        let mut query_builder: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                INSERT INTO session (category_id, type, start_time, end_time, description, user_id, id, template_id)
                "#,
        );

        query_builder.push_values(sessions.iter().cloned(), |mut b, session| {
            b.push_bind(session.category_id)
                .push_bind(String::from("fixed"))
                .push_bind(session.start_time)
                .push_bind(session.end_time)
                .push_bind(session.description.clone())
                .push_bind(actor.user_id.clone())
                .push_bind(session.id)
                .push_bind(session.template_id);
        });

        query_builder.build().execute(tx.as_mut()).await?;

        let mut tag_query_builder: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                INSERT INTO tag_to_session (session_id, tag_id)
            "#,
        );

        let tag_ids: Vec<(Uuid, Uuid)> = sessions
            .into_iter()
            .flat_map(|ts| ts.tag_ids.into_iter().map(move |tag_id| (ts.id, tag_id)))
            .collect();

        if !tag_ids.is_empty() {
            tag_query_builder.push_values(tag_ids, |mut b, tag_tuple| {
                b.push_bind(tag_tuple.0).push_bind(tag_tuple.1);
            });

            tag_query_builder.build().execute(tx.as_mut()).await?;
        }

        tx.commit().await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(user_id = %actor.user_id, category_id = %dto.category_id))]
    async fn create(&self, dto: CreateFixedSessionDto, actor: Actor) -> Result<FixedSession> {
        let result = sqlx::query!(
            r#"
                INSERT INTO session (category_id, type, start_time, end_time, description, user_id, template_id)
                VALUES ($1, $2,$3,$4,$5, $6, $7)
                RETURNING session.id
            "#,
            dto.category_id,
            String::from("fixed"),
            dto.start_time,
            dto.end_time,
            dto.description,
            actor.user_id,
            dto.template_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        // INFO: pair tags with created session
        for tag_id in dto.tag_ids {
            // TODO: this should be done with either UNNEST or bulk insert
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

        let session = self.find_by_id(result.id, actor.clone()).await?;
        match session {
            Some(val) => Ok(val),
            None => Err(anyhow!("Error creating the session")),
        }
    }

    #[instrument(err, skip(self), fields(user_id = %actor.user_id))]
    async fn filter_sessions(
        &self,
        dto: FilterSessionDto,
        actor: Actor,
    ) -> Result<Vec<Self::SessionType>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"SELECT 
                s.id,
                s.user_id,
                s.start_time,
                s.description,
                s.end_time,
                s.type as session_type,

                s.category_id,
                c.name as category,
                c.color as category_color,
                c.last_used_at as "category_last_used_at",

                t.id as tag_id,
                t.label as tag_label,
                t.color as tag_color,
                t.last_used_at as "tag_last_used_at",

                st.id as template_id,
                st.name as template_name,
                st.start_date as "template_start_date",
                st.end_date as "template_end_date",
                st.interval AS "template_interval"
            FROM session s
            JOIN category c
                on c.id = s.category_id
            LEFT JOIN tag_to_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            LEFT JOIN session_template st
                on st.id = s.template_id
            WHERE 
                s.user_id = "#,
        );
        query.push_bind(actor.clone().user_id);

        if let Some(from_endtime) = dto.clone().from_end_time {
            query
                .push(" and s.end_time >= ")
                .push_bind(from_endtime.value);
        }

        if let Some(to_endtime) = dto.clone().to_end_time {
            query
                .push(" and s.end_time <= ")
                .push_bind(to_endtime.value);
        }

        if let Some(from_starttime) = dto.clone().from_start_time {
            query
                .push(" and s.start_time >= ")
                .push_bind(from_starttime.value);
        }

        if let Some(to_starttime) = dto.clone().to_start_time {
            query
                .push(" and s.start_time <= ")
                .push_bind(to_starttime.value);
        }

        query.push(" ORDER BY s.start_time DESC");

        let rows = query
            .build_query_as::<GenericFullRowSession>()
            .fetch_all(self.db_conn.get_pool())
            .await?;
        let newDto = dto.clone();

        let mut sessions = self.convert(rows)?;
        let _grouped_results = self
            .group_sessions(
                newDto,
                GroupingOption::User,
                AggregatingOptions::Count,
                actor.clone(),
            )
            .await?;

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

    #[instrument(err, skip(self), fields(id = %id, user_id = %actor.user_id))]
    async fn delete_session(&self, id: Uuid, actor: Actor) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM session
                WHERE session.id = $1 and session.user_id = $2
            "#,
            id,
            actor.user_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(user_id = %actor.user_id))]
    async fn delete_sessions_by_filter(&self, dto: FilterSessionDto, actor: Actor) -> Result<u64> {
        if dto.is_empty() {
            return Err(anyhow!(
                "No filters were specified - aborting session deletion"
            ));
        }
        println!("Tags: {:?}", dto);

        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"DELETE FROM session s
            WHERE s.user_id = "#,
        );
        query.push_bind(actor.user_id);
        query.push(" AND s.type = 'fixed'");

        if let Some(from_endtime) = dto.from_end_time {
            query
                .push(" AND s.end_time >= ")
                .push_bind(from_endtime.value);
        }

        if let Some(to_endtime) = dto.to_end_time {
            query
                .push(" AND s.end_time <= ")
                .push_bind(to_endtime.value);
        }

        if let Some(from_starttime) = dto.from_start_time {
            query
                .push(" AND s.start_time >= ")
                .push_bind(from_starttime.value);
        }

        if let Some(to_starttime) = dto.to_start_time {
            query
                .push(" AND s.start_time <= ")
                .push_bind(to_starttime.value);
        }

        if let Some(template_id) = dto.template_id {
            query.push(" AND s.template_id = ").push_bind(template_id);
        }

        let result = query.build().execute(self.db_conn.get_pool()).await?;

        Ok(result.rows_affected())
    }

    #[instrument(err, skip(self), fields(session_id = %dto.id, user_id = %actor.user_id))]
    async fn update_session(
        &self,
        dto: UpdateFixedSessionDto,
        actor: Actor,
    ) -> Result<Self::SessionType> {
        let mut tx = self.db_conn.get_pool().begin().await?;
        sqlx::query(
            r#"
                UPDATE "session" s SET
                    description = COALESCE($1, s.description),
                    start_time = COALESCE($2, s.start_time),
                    end_time = COALESCE($3, s.start_time),
                    category_id = COALESCE($4, s.category_id)
                WHERE s.id = $5
            "#,
        )
        .bind(dto.description)
        .bind(dto.start_time)
        .bind(dto.end_time)
        .bind(dto.category_id)
        .bind(dto.id)
        .execute(tx.as_mut())
        .await?;

        if let Some(tags) = dto.tag_ids {
            sqlx::query!(
                r#"
                DELETE FROM tag_to_session
                WHERE session_id = $1
            "#,
                dto.id
            )
            .execute(tx.as_mut())
            .await?;

            let query = r#"
                    INSERT INTO tag_to_session (session_id, tag_id)
                    SELECT $1, tag_id FROM UNNEST($2::uuid[]) AS tag_id
                "#;

            sqlx::query(query)
                .bind(dto.id)
                .bind(tags)
                .execute(tx.as_mut())
                .await?;
        }
        tx.commit().await?;

        let session = self.find_by_id(dto.id, actor).await?;
        match session {
            Some(val) => Ok(val),
            None => Err(anyhow!("Error updating the session")),
        }
    }

    #[instrument(err, skip(self), fields(id = %id))]
    async fn find_by_id_admin(&self, id: Uuid) -> Result<Option<Self::SessionType>> {
        let sessions = sqlx::query_as!(
            GenericFullRowSession,
            r#"SELECT 
                s.id,
                s.user_id as "user_id!",
                s.start_time,
                s.description,
                s.end_time,
                s.type as session_type,

                s.category_id,
                c.name as category,
                c.color as category_color,
                c.last_used_at as category_last_used_at,

                t.id as "tag_id?",
                t.label as "tag_label?",
                t.color as "tag_color?",
                t.last_used_at as "tag_last_used_at?",

                st.id as "template_id?",
                st.name as "template_name?",
                st.start_date as "template_start_date?",
                st.end_date as "template_end_date?",
                st.interval AS "template_interval?: RecurringSessionInterval"
            FROM session s
            JOIN category c
                on c.id = s.category_id
            LEFT JOIN tag_to_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            LEFT JOIN session_template st
                on st.id = s.template_id
            WHERE 
                s.id = $1
                AND type = 'fixed' 
                "#,
            id,
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        let result = self.convert(sessions)?;
        match result.first() {
            Some(val) => Ok(Some(val.clone())),
            None => Ok(None),
        }
    }

    async fn group_sessions(
        &self,
        dto: FilterSessionDto,
        group: GroupingOption,
        aggregate: AggregatingOptions,
        actor: Actor,
    ) -> Result<Vec<GroupedResult>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"SELECT 
                "#,
        );

        let select = match aggregate {
            AggregatingOptions::Count => {
                r#"
                COUNT(*) as count,
            "#
            }
            AggregatingOptions::SumTime => {
                r#"
                SUM(end_time - start_time) AS total_duration,
            "#
            }
        };

        let grouped_by = match group {
            GroupingOption::User => {
                r#"
                s.user_id
            "#
            }
            GroupingOption::Tag => {
                r#"
                t.id as tag_id,
                t.label as tag_label,
                t.color as tag_color,
                t.last_used_at as "tag_last_used_at"

            "#
            }
            GroupingOption::Category => {
                r#"
                c.id as category_id,
                c.name as category,
                c.color as category_color,
                c.last_used_at as "category_last_used_at"
            "#
            }
            GroupingOption::Template => {
                r#"
                st.id as template_id,
                st.name as template_name,
                st.start_date as "template_start_date",
                st.end_date as "template_end_date",
                st.interval AS "template_interval"
            "#
            }
            GroupingOption::Date(date_grouping) => match date_grouping {
                DateGrouping::Year => {
                    r#"
                        DATE_TRUNC("year", s.end_time) grouped_date
                    "#
                }
                DateGrouping::Month => {
                    r#"
                        DATE_TRUNC("month", s.end_time) grouped_date
                    "#
                }
                DateGrouping::Week => {
                    r#"
                        DATE_TRUNC("week", s.end_time) grouped_date
                    "#
                }
                DateGrouping::Day => {
                    r#"
                        DATE_TRUNC("day", s.end_time) grouped_date
                    "#
                }
            },
        };

        let joins = match group.clone() {
            GroupingOption::User => "",
            GroupingOption::Tag => {
                r#"
            LEFT JOIN tag_to_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            "#
            }
            GroupingOption::Category => {
                r#"

            JOIN category c
                on c.id = s.category_id
            "#
            }
            GroupingOption::Template => {
                r#"
            LEFT JOIN session_template st
                on st.id = s.template_id
            "#
            }
            GroupingOption::Date(date_grouping) => "",
        };
        query
            .push(select)
            .push(grouped_by)
            .push(
                r#"
            FROM session s
            "#,
            )
            .push(joins)
            .push(
                r#"
            WHERE 
                s.user_id = 
        "#,
            )
            .push_bind(actor.user_id)
            .push(" GROUP BY ");

        // FILTERS HERE
        let actual_group_by = match group.clone() {
            GroupingOption::User => "s.user_id",
            GroupingOption::Tag => {
                r#"
                t.id 
            "#
            }
            GroupingOption::Category => {
                r#"
                c.id
            "#
            }
            GroupingOption::Template => {
                r#"
                st.id
            "#
            }
            GroupingOption::Date(_) => " grouped_date ",
        };
        query.push(actual_group_by);
        let rows = query.build().fetch_all(self.db_conn.get_pool()).await?;

        let grouped_results = map_grouped_rows_to_results(rows, group, aggregate)?;

        Ok(grouped_results)
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum DateGrouping {
    Year,
    Month,
    Week,
    Day,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum GroupingOption {
    User,
    Tag,
    Category,
    Template,
    Date(DateGrouping),
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum AggregatingOptions {
    Count,
    SumTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AggregateValue {
    Count(i64),
    Duration(chrono::Duration),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserGroupedResult {
    pub user_id: String,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagGroupedResult {
    pub tag_id: Option<Uuid>,
    pub tag_label: Option<String>,
    pub tag_color: Option<String>,
    pub tag_last_used_at: Option<DateTime<Utc>>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryGroupedResult {
    pub category_id: Uuid,
    pub category: String,
    pub category_color: String,
    pub category_last_used_at: DateTime<Utc>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateGroupedResult {
    pub template_id: Option<Uuid>,
    pub template_name: Option<String>,
    pub template_start_date: Option<DateTime<Utc>>,
    pub template_end_date: Option<DateTime<Utc>>,
    pub template_interval: Option<RecurringSessionInterval>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateGroupedResult {
    pub grouped_date: DateTime<Utc>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GroupedResult {
    User(UserGroupedResult),
    Tag(TagGroupedResult),
    Category(CategoryGroupedResult),
    Template(TemplateGroupedResult),
    Date(DateGroupedResult),
}

pub fn map_grouped_rows_to_results(
    rows: Vec<sqlx::postgres::PgRow>,
    grouping: GroupingOption,
    aggregating: AggregatingOptions,
) -> Result<Vec<GroupedResult>> {
    use sqlx::Row;

    let mut results = Vec::new();

    for row in rows {
        let aggregate = match aggregating {
            AggregatingOptions::Count => {
                let count: i64 = row.try_get("count")?;
                AggregateValue::Count(count)
            }
            AggregatingOptions::SumTime => {
                // PostgreSQL returns INTERVAL as a custom type, let's use a generic approach
                let interval: sqlx::postgres::types::PgInterval = row.try_get("total_duration")?;
                let total_microseconds = interval.microseconds
                    + interval.days as i64 * 24 * 60 * 60 * 1_000_000
                    + interval.months as i64 * 30 * 24 * 60 * 60 * 1_000_000;
                let chrono_duration = chrono::Duration::microseconds(total_microseconds);
                AggregateValue::Duration(chrono_duration)
            }
        };

        let grouped_result = match grouping {
            GroupingOption::User => {
                let user_id: String = row.try_get("user_id")?;
                GroupedResult::User(UserGroupedResult { user_id, aggregate })
            }
            GroupingOption::Tag => {
                let tag_id: Option<Uuid> = row.try_get("tag_id").ok();
                let tag_label: Option<String> = row.try_get("tag_label").ok();
                let tag_color: Option<String> = row.try_get("tag_color").ok();
                let tag_last_used_at: Option<DateTime<Utc>> = row.try_get("tag_last_used_at").ok();
                GroupedResult::Tag(TagGroupedResult {
                    tag_id,
                    tag_label,
                    tag_color,
                    tag_last_used_at,
                    aggregate,
                })
            }
            GroupingOption::Category => {
                let category_id: Uuid = row.try_get("category_id")?;
                let category: String = row.try_get("category")?;
                let category_color: String = row.try_get("category_color")?;
                let category_last_used_at: DateTime<Utc> = row.try_get("category_last_used_at")?;
                GroupedResult::Category(CategoryGroupedResult {
                    category_id,
                    category,
                    category_color,
                    category_last_used_at,
                    aggregate,
                })
            }
            GroupingOption::Template => {
                let template_id: Option<Uuid> = row.try_get("template_id").ok();
                let template_name: Option<String> = row.try_get("template_name").ok();
                let template_start_date: Option<DateTime<Utc>> =
                    row.try_get("template_start_date").ok();
                let template_end_date: Option<DateTime<Utc>> =
                    row.try_get("template_end_date").ok();
                let template_interval: Option<RecurringSessionInterval> =
                    row.try_get("template_interval").ok();
                GroupedResult::Template(TemplateGroupedResult {
                    template_id,
                    template_name,
                    template_start_date,
                    template_end_date,
                    template_interval,
                    aggregate,
                })
            }
            GroupingOption::Date(_) => {
                let grouped_date: DateTime<Utc> = row.try_get("grouped_date")?;
                GroupedResult::Date(DateGroupedResult {
                    grouped_date,
                    aggregate,
                })
            }
        };

        results.push(grouped_result);
    }

    Ok(results)
}
