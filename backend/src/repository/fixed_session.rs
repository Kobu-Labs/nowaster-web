use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, Postgres, QueryBuilder};
use std::{sync::Arc, vec};
use tracing::instrument;
use uuid::Uuid;

use crate::dto::session::{
    filter::{
        DateFilter, DurationFilter, FilterSession, IdFilter, ManyIdFilter, TagFilter,
        TemplateFilter,
    },
    fixed_session::{CreateFixedSessionDto, CreateFixedSessionDtoWithId, UpdateFixedSessionDto},
    grouped_session::{
        AggregateValue, AggregatingOptions, CategoryGroupedResult, DateGroupedResult, DateGrouping,
        GroupedResult, GroupingOption, TagGroupedResult, TemplateGroupedResult, UserGroupedResult,
    },
    template::ReadTemplateShallowDto,
};

use crate::{
    config::database::{Database, DatabaseTrait},
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

impl FixedSessionRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    fn convert(&self, sessions: Vec<GenericFullRowSession>) -> Result<Vec<FixedSession>> {
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
    pub async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Option<FixedSession>> {
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
    pub async fn create_many(&self, dtos: Vec<CreateFixedSessionDto>, actor: Actor) -> Result<()> {
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
    pub async fn create(&self, dto: CreateFixedSessionDto, actor: Actor) -> Result<FixedSession> {
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
        let mut tag_query_builder: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                INSERT INTO tag_to_session (session_id, tag_id)
            "#,
        );

        if !dto.tag_ids.is_empty() {
            tag_query_builder.push_values(dto.tag_ids, |mut b, tag_tuple| {
                b.push_bind(result.id).push_bind(tag_tuple);
            });

            tag_query_builder
                .build()
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
    pub async fn filter_sessions(&self, dto: FilterSession, actor: Actor) -> Result<Vec<FixedSession>> {
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
        self.build_new_filter_query(&dto, &mut query);

        let rows = query
            .build_query_as::<GenericFullRowSession>()
            .fetch_all(self.db_conn.get_pool())
            .await?;
        let sessions = self.convert(rows)?;

        Ok(sessions)
    }

    #[instrument(err, skip(self), fields(id = %id, user_id = %actor.user_id))]
    pub async fn delete_session(&self, id: Uuid, actor: Actor) -> Result<()> {
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
    pub async fn delete_sessions_by_filter(&self, filter: FilterSession, actor: Actor) -> Result<u64> {
        if filter.is_empty() {
            return Err(anyhow!(
                "No filters were specified - aborting session deletion"
            ));
        }

        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"DELETE FROM session s
            WHERE s.user_id = "#,
        );
        query.push_bind(actor.user_id);

        self.build_new_filter_query(&filter, &mut query);

        let result = query.build().execute(self.db_conn.get_pool()).await?;

        Ok(result.rows_affected())
    }

    #[instrument(err, skip(self), fields(session_id = %dto.id, user_id = %actor.user_id))]
    pub async fn update_session(
        &self,
        dto: UpdateFixedSessionDto,
        actor: Actor,
    ) -> Result<FixedSession> {
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
    pub async fn find_by_id_admin(&self, id: Uuid) -> Result<Option<FixedSession>> {
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

    pub async fn group_sessions(
        &self,
        filter: FilterSession,
        group: GroupingOption,
        aggregate: AggregatingOptions,
        actor: Actor,
    ) -> Result<Vec<GroupedResult>> {
        match group {
            GroupingOption::User => self.group_sessions_by_user(filter, aggregate, actor).await,
            GroupingOption::Tag => self.group_sessions_by_tag(filter, aggregate, actor).await,
            GroupingOption::Category => {
                self.group_sessions_by_category(filter, aggregate, actor)
                    .await
            }
            GroupingOption::Template => {
                self.group_sessions_by_template(filter, aggregate, actor)
                    .await
            }
            GroupingOption::Date(date_grouping) => {
                self.group_sessions_by_date(filter, aggregate, actor, date_grouping)
                    .await
            }
        }
    }
}

impl FixedSessionRepository {
    pub async fn group_sessions_by_user(
        &self,
        filter: FilterSession,
        aggregate: AggregatingOptions,
        actor: Actor,
    ) -> Result<Vec<GroupedResult>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            WITH filtered AS (
                SELECT DISTINCT
                    s.*
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
                    s.user_id = 
        "#,
        );

        query.push_bind(actor.user_id);

        self.build_new_filter_query(&filter, &mut query);
        query.push(
            r#"
                )
            SELECT 
        "#,
        );

        let select = self.get_aggregate_select(aggregate);

        query
            .push(select)
            .push(r#" s.user_id FROM filtered s WHERE s.type = 'fixed' "#);

        self.build_new_filter_query(&filter, &mut query);

        query.push(" GROUP BY s.user_id ");

        let rows = query.build().fetch_all(self.db_conn.get_pool()).await?;
        map_grouped_rows_to_results(rows, GroupingOption::User, aggregate)
    }

    pub async fn group_sessions_by_tag(
        &self,
        filter: FilterSession,
        aggregate: AggregatingOptions,
        actor: Actor,
    ) -> Result<Vec<GroupedResult>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            WITH filtered AS (
                SELECT DISTINCT
                    s.*
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
                    1=1
        "#,
        );
        self.build_new_filter_query(&filter, &mut query);
        query.push(
            r#"
            )
        SELECT 
        "#,
        );

        let select = self.get_aggregate_select(aggregate);

        query.push(select).push(
            r#"
                t.id as tag_id,
                t.label as tag_label,
                t.color as tag_color,
                t.last_used_at as "tag_last_used_at"
            FROM filtered s
            LEFT JOIN tag_to_session tts
                on tts.session_id = s.id
            LEFT JOIN tag t
                on tts.tag_id = t.id
            WHERE s.type = 'fixed'"#,
        );

        self.build_new_filter_query(&filter, &mut query);

        query.push(" GROUP BY t.id");

        let rows = query.build().fetch_all(self.db_conn.get_pool()).await?;
        map_grouped_rows_to_results(rows, GroupingOption::Tag, aggregate)
    }

    pub async fn group_sessions_by_category(
        &self,
        filter: FilterSession,
        aggregate: AggregatingOptions,
        actor: Actor,
    ) -> Result<Vec<GroupedResult>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            WITH filtered AS (
                SELECT DISTINCT
                    s.*
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
                    1=1
        "#,
        );
        self.build_new_filter_query(&filter, &mut query);
        query.push(
            r#"
            )
        SELECT 
        "#,
        );

        let select = self.get_aggregate_select(aggregate);

        query.push(select).push(
            r#"
                c.id as category_id,
                c.name as category,
                c.color as category_color,
                c.last_used_at as "category_last_used_at"
            FROM filtered s
            JOIN category c
                on c.id = s.category_id
            WHERE s.type = 'fixed'"#,
        );

        self.build_new_filter_query(&filter, &mut query);

        query.push(" GROUP BY c.id");

        let rows = query.build().fetch_all(self.db_conn.get_pool()).await?;
        map_grouped_rows_to_results(rows, GroupingOption::Category, aggregate)
    }

    pub async fn group_sessions_by_template(
        &self,
        filter: FilterSession,
        aggregate: AggregatingOptions,
        actor: Actor,
    ) -> Result<Vec<GroupedResult>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            WITH filtered AS (
                SELECT DISTINCT
                    s.*
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
                    1=1
        "#,
        );
        self.build_new_filter_query(&filter, &mut query);
        query.push(
            r#"
            )
        SELECT 
        "#,
        );

        let select = self.get_aggregate_select(aggregate);

        query.push(select).push(
            r#"
                st.id as template_id,
                st.name as template_name,
                st.start_date as "template_start_date",
                st.end_date as "template_end_date",
                st.interval AS "template_interval"
            FROM filtered s
            LEFT JOIN session_template st
                on st.id = s.template_id
            WHERE s.type = 'fixed'"#,
        );

        self.build_new_filter_query(&filter, &mut query);

        query.push(" GROUP BY st.id");

        let rows = query.build().fetch_all(self.db_conn.get_pool()).await?;
        map_grouped_rows_to_results(rows, GroupingOption::Template, aggregate)
    }

    pub async fn group_sessions_by_date(
        &self,
        filter: FilterSession,
        aggregate: AggregatingOptions,
        actor: Actor,
        date_grouping: DateGrouping,
    ) -> Result<Vec<GroupedResult>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
            WITH filtered AS (
                SELECT DISTINCT
                    s.*
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
                    1=1
        "#,
        );
        self.build_new_filter_query(&filter, &mut query);
        query.push(
            r#"
            )
        SELECT 
        "#,
        );

        let select = self.get_aggregate_select(aggregate);
        let date_expr = self.get_date_truncate_expression(date_grouping);

        query
            .push(select)
            .push(date_expr)
            .push(r#" FROM filtered s WHERE s.type = 'fixed'"#);

        self.build_new_filter_query(&filter, &mut query);

        query.push(" GROUP BY grouped_date");

        let rows = query.build().fetch_all(self.db_conn.get_pool()).await?;
        map_grouped_rows_to_results(rows, GroupingOption::Date(date_grouping), aggregate)
    }

    fn get_aggregate_select(&self, aggregate: AggregatingOptions) -> &'static str {
        match aggregate {
            AggregatingOptions::Count => "COUNT(*) as count,",
            AggregatingOptions::SumTime => {
                "CAST(SUM(EXTRACT(EPOCH FROM (end_time - start_time))) / 60 AS FLOAT8) AS total_minutes,"
            }
        }
    }

    fn get_date_truncate_expression(&self, date_grouping: DateGrouping) -> &'static str {
        match date_grouping {
            DateGrouping::Year => r#"DATE_TRUNC("year", s.end_time) grouped_date"#,
            DateGrouping::Month => r#"DATE_TRUNC("month", s.end_time) grouped_date"#,
            DateGrouping::Week => r#"DATE_TRUNC("week", s.end_time) grouped_date"#,
            DateGrouping::Day => r#"DATE_TRUNC("day", s.end_time) grouped_date"#,
        }
    }

    fn build_new_filter_query<'a>(
        &self,
        filter: &'a FilterSession,
        query: &mut QueryBuilder<'a, Postgres>,
    ) {
        // Handle user filter
        if let Some(user_filter) = &filter.user_filter {
            if let Some(id_filter) = &user_filter.id {
                match id_filter {
                    IdFilter::One(user_id) => {
                        query.push(" AND s.user_id = ").push_bind(user_id);
                    }
                    IdFilter::Many(many_filter) => {
                        // For user filter, treat both All and Any as ANY since it's a single field
                        match many_filter {
                            ManyIdFilter::All(user_ids) => {
                                query
                                    .push(" AND s.user_id = ANY(")
                                    .push_bind(user_ids)
                                    .push(")");
                            }
                            ManyIdFilter::Any(user_ids) => {
                                query
                                    .push(" AND s.user_id = ANY(")
                                    .push_bind(user_ids)
                                    .push(")");
                            }
                        }
                    }
                }
            }
        }

        // Handle category filter
        if let Some(category_filter) = &filter.category_filter {
            if let Some(id_filter) = &category_filter.id {
                match id_filter {
                    IdFilter::One(category_id) => {
                        query.push(" AND s.category_id = ").push_bind(category_id);
                    }
                    IdFilter::Many(many_filter) => match many_filter {
                        ManyIdFilter::All(category_ids) => {
                            query
                                .push(" AND s.category_id = ANY(")
                                .push_bind(category_ids)
                                .push(")");
                        }
                        ManyIdFilter::Any(category_ids) => {
                            query
                                .push(" AND s.category_id = ANY(")
                                .push_bind(category_ids)
                                .push(")");
                        }
                    },
                }
            }
        }

        // Handle tag filter
        if let Some(tag_filter) = &filter.tag_filter {
            match tag_filter {
                TagFilter::NoTag => {
                    query.push(" AND NOT EXISTS (SELECT 1 FROM tag_to_session tts WHERE tts.session_id = s.id)");
                }
                TagFilter::Filter(tag_filter_filter) => {
                    if let Some(id_filter) = &tag_filter_filter.id {
                        match id_filter {
                            IdFilter::One(tag_id) => {
                                query.push(" AND EXISTS (SELECT 1 FROM tag_to_session tts WHERE tts.session_id = s.id AND tts.tag_id = ").push_bind(tag_id).push(")");
                            }
                            IdFilter::Many(many_filter) => {
                                match many_filter {
                                    ManyIdFilter::All(tag_ids) => {
                                        // INFO: session must have ALL specified tags
                                        for tag_id in tag_ids {
                                            query.push(" AND EXISTS (SELECT 1 FROM tag_to_session tts WHERE tts.session_id = s.id AND tts.tag_id = ").push_bind(tag_id).push(")");
                                        }
                                    }
                                    ManyIdFilter::Any(tag_ids) => {
                                        // INFO: session must have at least one of the specified tags
                                        query.push(" AND EXISTS (SELECT 1 FROM tag_to_session tts WHERE tts.session_id = s.id AND tts.tag_id = ANY(").push_bind(tag_ids).push("))");
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Handle start time filter
        if let Some(start_time_filter) = &filter.start_time_filter {
            match start_time_filter {
                DateFilter::GreaterThanEqual(date) => {
                    query.push(" AND s.start_time >= ").push_bind(date);
                }
                DateFilter::GreaterThan(date) => {
                    query.push(" AND s.start_time > ").push_bind(date);
                }
                DateFilter::LessThanEqual(date) => {
                    query.push(" AND s.start_time <= ").push_bind(date);
                }
                DateFilter::LessThan(date) => {
                    query.push(" AND s.start_time < ").push_bind(date);
                }
                DateFilter::Equal(date) => {
                    query.push(" AND s.start_time = ").push_bind(date);
                }
            }
        }

        // Handle end time filter
        if let Some(end_time_filter) = &filter.end_time_filter {
            match end_time_filter {
                DateFilter::GreaterThanEqual(date) => {
                    query.push(" AND s.end_time >= ").push_bind(date);
                }
                DateFilter::GreaterThan(date) => {
                    query.push(" AND s.end_time > ").push_bind(date);
                }
                DateFilter::LessThanEqual(date) => {
                    query.push(" AND s.end_time <= ").push_bind(date);
                }
                DateFilter::LessThan(date) => {
                    query.push(" AND s.end_time < ").push_bind(date);
                }
                DateFilter::Equal(date) => {
                    query.push(" AND s.end_time = ").push_bind(date);
                }
            }
        }

        // Handle template filter
        if let Some(template_filter) = &filter.template_filter {
            match template_filter {
                TemplateFilter::NoTemplate => {
                    query.push(" AND s.template_id IS NULL");
                }
                TemplateFilter::Filter(template_filter_filter) => {
                    if let Some(id_filter) = &template_filter_filter.id {
                        match id_filter {
                            IdFilter::One(template_id) => {
                                query.push(" AND s.template_id = ").push_bind(template_id);
                            }
                            IdFilter::Many(many_filter) => match many_filter {
                                ManyIdFilter::All(template_ids) => {
                                    query
                                        .push(" AND s.template_id = ANY(")
                                        .push_bind(template_ids)
                                        .push(")");
                                }
                                ManyIdFilter::Any(template_ids) => {
                                    query
                                        .push(" AND s.template_id = ANY(")
                                        .push_bind(template_ids)
                                        .push(")");
                                }
                            },
                        }
                    }
                }
            }
        }

        // Handle duration filter (for fixed sessions with non-null end_time)
        if let Some(duration_filter) = &filter.duration_filter {
            match duration_filter {
                DurationFilter::GreaterThanEqual(minutes) => {
                    query
                        .push(" AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60 >= ")
                        .push_bind(minutes);
                }
                DurationFilter::GreaterThan(minutes) => {
                    query
                        .push(" AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60 > ")
                        .push_bind(minutes);
                }
                DurationFilter::LessThanEqual(minutes) => {
                    query
                        .push(" AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60 <= ")
                        .push_bind(minutes);
                }
                DurationFilter::LessThan(minutes) => {
                    query
                        .push(" AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60 < ")
                        .push_bind(minutes);
                }
                DurationFilter::Equal(minutes) => {
                    query
                        .push(" AND EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60 = ")
                        .push_bind(minutes);
                }
            }
        }
    }
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
                let interval: f64 = row.try_get("total_minutes")?;
                AggregateValue::Duration(interval)
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
