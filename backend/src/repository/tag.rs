use anyhow::{Ok, Result};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::{
        category::{
            migrate_category::{MigrationPreviewResponse, SessionPreview},
            read_category::ReadCategoryDto,
        },
        tag::{
            create_tag::{CreateTagDto, UpdateTagDto},
            filter_tags::TagFilterDto,
            migrate_tag::TagMigrationFilters,
            read_tag::{ReadTagDto, TagStatsDto},
        },
    },
    entity::{category::Category, tag::TagDetails},
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct TagRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize)]
pub struct ReadTagRow {
    id: Uuid,
    label: String,
    created_by: String,
    color: String,
}

#[derive(sqlx::FromRow)]
struct ReadTagDetailsRow {
    created_by: String,
    tag_id: Uuid,
    tag_label: String,
    tag_color: String,
    category_id: Option<Uuid>,
    category_name: Option<String>,
    category_color: Option<String>,
    usages: i64,
}

pub trait TagRepositoryTrait {
    async fn find_by_id(&self, id: Uuid, actor: ClerkUser) -> Result<TagDetails>;
    async fn update_tag(&self, id: Uuid, dto: UpdateTagDto, actor: ClerkUser)
        -> Result<TagDetails>;
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn create(&self, dto: CreateTagDto, actor: ClerkUser) -> Result<TagDetails>;
    async fn filter_tags(&self, filter: TagFilterDto, actor: ClerkUser) -> Result<Vec<TagDetails>>;
    async fn delete_tag(&self, id: Uuid, actor: ClerkUser) -> Result<()>;
    async fn add_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()>;
    async fn remove_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()>;
    async fn get_tag_statistics(&self, actor: ClerkUser) -> Result<TagStatsDto>;
    async fn get_tag_migration_preview(
        &self,
        from_tag_id: Uuid,
        filters: &TagMigrationFilters,
        actor: ClerkUser,
    ) -> Result<MigrationPreviewResponse>;
    async fn migrate_tag(
        &self,
        from_tag_id: Uuid,
        target_tag_id: Option<Uuid>,
        filters: &TagMigrationFilters,
        actor: ClerkUser,
    ) -> Result<u64>;
}

impl TagRepositoryTrait for TagRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn create(&self, dto: CreateTagDto, actor: ClerkUser) -> Result<TagDetails> {
        let row = sqlx::query_as!(
            ReadTagRow,
            r#"
                WITH inserted AS (
                    INSERT INTO tag (label, created_by, color)
                    VALUES ($1, $2, $3)
                    RETURNING tag.id, tag.label, tag.created_by, tag.color
                )
                SELECT i.id as "id!", i.label as "label!", i.created_by as "created_by!", i.color as "color!" FROM inserted i
                UNION ALL
                SELECT c.id, c.label, c.created_by, c.color FROM tag c WHERE c.label = $1 and c.created_by = $2
            "#,
            dto.label,
            actor.user_id,
            dto.color
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        let query = r#"
            INSERT INTO tag_category (tag_id, category_id)
            SELECT $1, category_id FROM UNNEST($2::uuid[]) AS category_id
            "#;

        sqlx::query(query)
            .bind(row.id)
            .bind(
                dto.allowed_categories
                    .iter()
                    .map(|cat| cat.id)
                    .collect::<Vec<Uuid>>(),
            )
            .execute(self.db_conn.get_pool())
            .await?;

        let categories = sqlx::query_as!(
            ReadCategoryDto,
            r#"
            SELECT cat.id, cat.name, cat.color
            FROM category cat
            JOIN tag_category tc ON tc.category_id = cat.id
            WHERE tc.tag_id = $1
        "#,
            row.id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(TagDetails {
            id: row.id,
            label: row.label,
            color: row.color,
            created_by: row.created_by,
            allowed_categories: categories
                .into_iter()
                .map(|cat| Category {
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    created_by: actor.user_id.clone(),
                })
                .collect(),
            usages: 0,
        })
    }

    async fn delete_tag(&self, id: Uuid, actor: ClerkUser) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM tag
                WHERE tag.id = $1 AND tag.created_by = $2
            "#,
            id,
            actor.user_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    async fn find_by_id(&self, id: Uuid, actor: ClerkUser) -> Result<TagDetails> {
        let result = self
            .filter_tags(
                TagFilterDto {
                    id: Some(id),
                    label: None,
                },
                actor,
            )
            .await?;

        if let Some(tag) = result.first() {
            return Ok(tag.clone());
        }
        Err(anyhow::anyhow!("Tag not found"))
    }

    async fn filter_tags(&self, filter: TagFilterDto, actor: ClerkUser) -> Result<Vec<TagDetails>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                SELECT 
                    tag.id AS tag_id,
                    tag.label AS tag_label,
                    tag.created_by AS "created_by",
                    tag.color as tag_color,
                    category.id AS category_id,
                    category.name AS category_name,
                    category.color AS category_color,
                    COALESCE(usage_vals.usages, 0) AS usages
                FROM tag
                LEFT OUTER JOIN tag_category ON tag_category.tag_id = tag.id
                LEFT OUTER JOIN category ON category.id = tag_category.category_id
                LEFT OUTER JOIN (
                    SELECT tag_id, COUNT(*) AS usages
                    FROM tag_to_session
                    GROUP BY tag_id
                ) AS usage_vals ON usage_vals.tag_id = tag.id
                WHERE tag.created_by = 
            "#,
        );
        query.push_bind(actor.user_id);

        if let Some(id) = filter.id {
            query.push(" and tag.id = ").push_bind(id);
        }

        if let Some(label) = filter.label {
            query.push(" and tag.label = ").push_bind(label);
        }
        query.push(" ORDER BY tag.last_used_at DESC NULLS LAST");

        let rows = query
            .build_query_as::<ReadTagDetailsRow>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        let mut tags_map: IndexMap<Uuid, TagDetails> = IndexMap::new();

        for row in rows {
            let tag = tags_map.entry(row.tag_id).or_insert_with(|| TagDetails {
                id: row.tag_id,
                label: row.tag_label.clone(),
                color: row.tag_color.clone(),
                allowed_categories: Vec::new(),
                created_by: row.created_by.clone(),
                usages: row.usages,
            });

            if let (Some(cat_id), Some(cat_name), Some(cat_color)) = (
                row.category_id,
                row.category_name.clone(),
                row.category_color.clone(),
            ) {
                tag.allowed_categories.push(Category {
                    id: cat_id,
                    name: cat_name,
                    color: cat_color,
                    created_by: row.created_by.clone(),
                });
            }
        }

        let tags: Vec<TagDetails> = tags_map.into_values().collect();
        Ok(tags)
    }

    async fn add_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"
                INSERT INTO tag_category (tag_id, category_id)
                VALUES ($1, $2)
            "#,
            tag_id,
            category_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    async fn remove_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM tag_category
                WHERE tag_id = $1 AND category_id = $2
            "#,
            tag_id,
            category_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    async fn update_tag(
        &self,
        id: Uuid,
        dto: UpdateTagDto,
        actor: ClerkUser,
    ) -> Result<TagDetails> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                UPDATE "tag" SET
            "#,
        );

        let mut fields = vec![];

        if let Some(label) = dto.label {
            fields.push(("label", label));
        }

        if let Some(color) = dto.color {
            fields.push(("color", color));
        }

        for (i, (field, value)) in fields.clone().into_iter().enumerate() {
            if i > 0 {
                query.push(", ");
            }
            query.push(format!("{field} = ")).push_bind(value);
        }

        query.push(" WHERE id = ").push_bind(id);
        query
            .push(" AND created_by = ")
            .push_bind(actor.user_id.clone());
        query.push(" RETURNING tag.id, tag.label, tag.created_by, tag.color ");

        if fields.is_empty() && dto.allowed_categories.is_none() {
            return Err(anyhow::anyhow!("No fields to update"));
        }

        let row = query
            .build_query_as::<ReadTagRow>()
            .fetch_one(self.db_conn.get_pool())
            .await?;

        if let Some(allowed_categories) = dto.allowed_categories {
            sqlx::query!(
                r#"
                DELETE FROM tag_category
                WHERE tag_id = $1
            "#,
                row.id
            )
            .execute(self.db_conn.get_pool())
            .await?;
            let categoories = allowed_categories
                .iter()
                .map(|cat| cat.id)
                .collect::<Vec<Uuid>>();

            let query = r#"
                    INSERT INTO tag_category (tag_id, category_id)
                    SELECT $1, category_id FROM UNNEST($2::uuid[]) AS category_id
                "#;

            sqlx::query(query)
                .bind(id)
                .bind(categoories)
                .execute(self.db_conn.get_pool())
                .await?;
        }

        self.find_by_id(id, actor.clone()).await
    }

    async fn get_tag_statistics(&self, actor: ClerkUser) -> Result<TagStatsDto> {
        // Get total tags count
        let total_tags = sqlx::query_scalar!(
            "SELECT COUNT(DISTINCT id) FROM tag WHERE created_by = $1",
            actor.user_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        // Get total usages
        let total_usages = sqlx::query_scalar!(
            r#"
                SELECT COUNT(*)
                FROM tag_to_session tts
                JOIN tag t ON t.id = tts.tag_id
                WHERE t.created_by = $1
            "#,
            actor.user_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        // Get most used tag
        let most_used = sqlx::query!(
            r#"
                SELECT 
                    t.id, 
                    t.label, 
                    t.color
                FROM tag t
                LEFT JOIN tag_to_session tts ON t.id = tts.tag_id
                WHERE t.created_by = $1
                GROUP BY t.id, t.label, t.color
                ORDER BY COUNT(tts.tag_id) DESC
                LIMIT 1
            "#,
            actor.user_id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        let most_used_tag = most_used.map(|row| ReadTagDto {
            id: row.id,
            label: row.label,
            color: row.color,
        });

        let average_usages_per_tag = if total_tags.unwrap_or(0) > 0 {
            total_usages.unwrap_or(0) as f64 / total_tags.unwrap_or(0) as f64
        } else {
            0.0
        };

        Ok(TagStatsDto {
            total_tags: total_tags.unwrap_or(0),
            total_usages: total_usages.unwrap_or(0),
            average_usages_per_tag,
            most_used_tag,
        })
    }

    async fn get_tag_migration_preview(
        &self,
        from_tag_id: Uuid,
        filters: &TagMigrationFilters,
        actor: ClerkUser,
    ) -> Result<MigrationPreviewResponse> {
        let mut query = QueryBuilder::<Postgres>::new(
            r#"
                SELECT DISTINCT
                    s.id,
                    s.description,
                    s.start_time,
                    s.end_time,
                    c.name as current_category_name,
                    COALESCE(string_agg(t.name, ',' ORDER BY t.name), '') as current_tag_names
                FROM session s
                JOIN tag_to_session st ON s.id = st.session_id
                JOIN category c ON s.category_id = c.id
                LEFT JOIN tag_to_session st2 ON s.id = st2.session_id
                LEFT JOIN tag t ON st2.tag_id = t.id AND t.created_by = 
            "#,
        );

        query.push_bind(&actor.user_id);
        query.push(
            r#"
                WHERE s.user_id = 
            "#,
        );
        query.push_bind(&actor.user_id);
        query.push(" AND st.tag_id = ");
        query.push_bind(from_tag_id);

        // Apply filters
        if let Some(category_ids) = &filters.category_ids {
            if !category_ids.is_empty() {
                query.push(" AND s.category_id = ANY(");
                query.push_bind(category_ids);
                query.push(")");
            }
        }

        if let Some(start_time) = &filters.from_start_time {
            query.push(" AND s.start_time >= ");
            query.push_bind(start_time);
        }

        if let Some(end_time) = &filters.to_end_time {
            query.push(" AND s.start_time <= ");
            query.push_bind(end_time);
        }

        query.push(" GROUP BY s.id, s.description, s.start_time, s.end_time, c.name ORDER BY s.start_time DESC LIMIT 10");

        let session_previews = query
            .build_query_as::<SessionPreview>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        // Get count of affected sessions
        let mut count_query = QueryBuilder::<Postgres>::new(
            r#"
                SELECT COUNT(DISTINCT s.id) as count
                FROM session s
                JOIN tag_to_session st ON s.id = st.session_id
                WHERE s.user_id = 
            "#,
        );
        count_query.push_bind(&actor.user_id);
        count_query.push(" AND st.tag_id = ");
        count_query.push_bind(from_tag_id);

        // Apply same filters for count
        if let Some(category_ids) = &filters.category_ids {
            if !category_ids.is_empty() {
                count_query.push(" AND s.category_id = ANY(");
                count_query.push_bind(category_ids);
                count_query.push(")");
            }
        }

        if let Some(start_time) = &filters.from_start_time {
            count_query.push(" AND s.start_time >= ");
            count_query.push_bind(start_time);
        }

        if let Some(end_time) = &filters.to_end_time {
            count_query.push(" AND s.start_time <= ");
            count_query.push_bind(end_time);
        }

        let count_result: (i64,) = count_query
            .build_query_as()
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(MigrationPreviewResponse {
            affected_sessions_count: count_result.0,
            session_previews,
        })
    }

    async fn migrate_tag(
        &self,
        from_tag_id: Uuid,
        target_tag_id: Option<Uuid>,
        filters: &TagMigrationFilters,
        actor: ClerkUser,
    ) -> Result<u64> {
        let mut tx = self.db_conn.get_pool().begin().await?;

        let mut query = if let Some(target_id) = target_tag_id {
            let mut query_inner = QueryBuilder::<Postgres>::new(
                r#"
                    UPDATE tag_to_session t
                    SET tag_id = 
                "#,
            );
            query_inner.push_bind(target_id);
            query_inner.push(
                r#"
                    FROM session s
                "#,
            );
            query_inner
        } else {
            // Remove tag completely - use DELETE
            QueryBuilder::<Postgres>::new(
                r#"
                    DELETE FROM tag_to_session t
                    USING session s
                "#,
            )
        };

        query.push(
            r#"
                WHERE t.session_id = s.id
                AND s.user_id = 
            "#,
        );
        query.push_bind(&actor.user_id);
        query.push(" AND t.tag_id = ");
        query.push_bind(from_tag_id);

        if let Some(category_ids) = &filters.category_ids {
            if !category_ids.is_empty() {
                query.push(" AND s.category_id = ANY(");
                query.push_bind(category_ids);
                query.push(")");
            }
        }

        if let Some(start_time) = &filters.from_start_time {
            query.push(" AND s.start_time >= ");
            query.push_bind(start_time);
        }

        if let Some(end_time) = &filters.to_end_time {
            query.push(" AND s.start_time <= ");
            query.push_bind(end_time);
        }

        let result = query.build().execute(&mut *tx).await?;

        tx.commit().await?;
        Ok(result.rows_affected())
    }
}
