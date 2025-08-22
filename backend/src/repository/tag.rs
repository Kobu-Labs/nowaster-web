use anyhow::Result;
use chrono::{DateTime, Utc};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::{
        category::read_category::ReadCategoryDto,
        tag::{
            create_tag::{CreateTagDto, UpdateTagDto},
            filter_tags::TagFilterDto,
            read_tag::{ReadTagDto, TagStatsDto},
        },
    },
    entity::{category::Category, tag::TagDetails},
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct TagRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug)]
pub struct ReadTagRow {
    id: Uuid,
    label: String,
    created_by: String,
    color: String,
    last_used_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow, Debug)]
struct ReadTagDetailsRow {
    created_by: String,

    tag_id: Uuid,
    tag_label: String,
    tag_color: String,
    usages: i64,
    last_used_at: DateTime<Utc>,

    category_id: Option<Uuid>,
    category_name: Option<String>,
    category_color: Option<String>,
    category_last_used_at: Option<DateTime<Utc>>,
}

impl TagRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn create(&self, dto: CreateTagDto, actor: Actor) -> Result<TagDetails> {
        let row = sqlx::query_as!(
            ReadTagRow,
            r#"
                WITH inserted AS (
                    INSERT INTO tag (label, created_by, color)
                    VALUES ($1, $2, $3)
                    RETURNING tag.id, tag.label, tag.created_by, tag.color, tag.last_used_at
                )
                SELECT
                    i.id as "id!",
                    i.label as "label!",
                    i.created_by as "created_by!",
                    i.color as "color!",
                    i.last_used_at as "last_used_at!"
                FROM inserted i
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
            SELECT cat.id, cat.name, cat.color, cat.last_used_at
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
            last_used_at: row.last_used_at,
            allowed_categories: categories
                .into_iter()
                .map(|cat| Category {
                    id: cat.id,
                    name: cat.name,
                    color: cat.color,
                    created_by: actor.user_id.clone(),
                    last_used_at: cat.last_used_at,
                })
                .collect(),
            usages: 0,
        })
    }

    #[instrument(err, skip(self), fields(tag_id = %id, actor_id = %actor))]
    pub async fn delete_tag(&self, id: Uuid, actor: Actor) -> Result<()> {
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

    #[instrument(err, skip(self), fields(tag_id = %id, actor_id = %actor))]
    pub async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<TagDetails> {
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

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn filter_tags(&self, filter: TagFilterDto, actor: Actor) -> Result<Vec<TagDetails>> {
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
                    category.last_used_at AS category_last_used_at,

                    COALESCE(usage_vals.usages, 0) AS usages,
                    tag.last_used_at
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
                last_used_at: row.last_used_at,
                label: row.tag_label.clone(),
                color: row.tag_color.clone(),
                allowed_categories: Vec::new(),
                created_by: row.created_by.clone(),
                usages: row.usages,
            });

            if let (Some(cat_id), Some(cat_name), Some(cat_color), Some(last_used_at)) = (
                row.category_id,
                row.category_name.clone(),
                row.category_color.clone(),
                row.category_last_used_at,
            ) {
                tag.allowed_categories.push(Category {
                    id: cat_id,
                    name: cat_name,
                    color: cat_color,
                    last_used_at: last_used_at.into(),
                    created_by: row.created_by.clone(),
                });
            }
        }

        let tags: Vec<TagDetails> = tags_map.into_values().collect();
        Ok(tags)
    }

    #[instrument(err, skip(self), fields(tag_id = %tag_id, category_id = %category_id))]
    pub async fn add_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()> {
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

    #[instrument(err, skip(self), fields(tag_id = %tag_id, category_id = %category_id))]
    pub async fn remove_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()> {
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

    #[instrument(err, skip(self), fields(tag_id = %id, actor_id = %actor))]
    pub async fn update_tag(
        &self,
        id: Uuid,
        dto: UpdateTagDto,
        actor: Actor,
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

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_tag_statistics(&self, actor: Actor) -> Result<TagStatsDto> {
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
}
