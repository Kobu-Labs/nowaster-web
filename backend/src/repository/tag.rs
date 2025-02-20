use anyhow::{Ok, Result};
use sqlx::{Postgres, QueryBuilder};
use std::{collections::HashMap, sync::Arc};
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::{
        category::read_category::ReadCategoryDto,
        tag::{create_tag::UpsertTagDto, filter_tags::TagFilterDto},
    },
    entity::{category::Category, tag::TagDetails},
};

#[derive(Clone)]
pub struct TagRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow)]
pub struct ReadTagRow {
    id: Uuid,
    label: String,
}

#[derive(sqlx::FromRow)]
struct ReadTagDetailsRow {
    tag_id: Uuid,
    tag_label: String,
    category_id: Option<Uuid>,
    category_name: Option<String>,
    usages: i64,
}

pub trait TagRepositoryTrait {
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn upsert(&self, dto: UpsertTagDto) -> Result<TagDetails>;
    async fn filter_tags(&self, filter: TagFilterDto) -> Result<Vec<TagDetails>>;
    async fn delete_tag(&self, id: Uuid) -> Result<()>;
    async fn add_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()>;
    async fn remove_allowed_category(&self, tag_id: Uuid, category_id: Uuid) -> Result<()>;
}

impl TagRepositoryTrait for TagRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn upsert(&self, dto: UpsertTagDto) -> Result<TagDetails> {
        let row = sqlx::query_as!(
            ReadTagRow,
            r#"
                WITH inserted AS (
                    INSERT INTO tag (label)
                    VALUES ($1)
                    ON CONFLICT (label) DO NOTHING
                    RETURNING tag.id, tag.label
                )
                SELECT i.id as "id!", i.label as "label!" FROM inserted i
                UNION ALL
                SELECT c.id, c.label FROM tag c WHERE c.label = $1
            "#,
            dto.label
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
            SELECT cat.id, cat.name
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
            allowed_categories: categories
                .into_iter()
                .map(|cat| Category {
                    id: cat.id,
                    name: cat.name,
                })
                .collect(),
            usages: 0,
        })
    }

    async fn delete_tag(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM tag
                WHERE tag.id = $1
            "#,
            id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    async fn filter_tags(&self, filter: TagFilterDto) -> Result<Vec<TagDetails>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            "
                SELECT 
                    tag.id AS tag_id,
                    tag.label AS tag_label,
                    category.id AS category_id,
                    category.name AS category_name,
                    COALESCE(usage_vals.usages, 0) AS usages
                FROM tag
                LEFT OUTER JOIN tag_category ON tag_category.tag_id = tag.id
                LEFT OUTER JOIN category ON category.id = tag_category.category_id
                LEFT OUTER JOIN (
                    SELECT tag_id, COUNT(*) AS usages
                    FROM tag_to_session
                    GROUP BY tag_id
                ) AS usage_vals ON usage_vals.tag_id = tag.id
                WHERE 1=1
            ",
        );

        if let Some(id) = filter.id {
            query.push(" and tag.id = ").push_bind(id);
        }

        if let Some(label) = filter.label {
            query.push(" and tag.label = ").push_bind(label);
        }

        query.push(" ORDER BY usages DESC");

        let rows = query
            .build_query_as::<ReadTagDetailsRow>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        let mut tags_map: IndexMap<Uuid, TagDetails> = IndexMap::new();

        for row in rows {
            let tag = tags_map.entry(row.tag_id).or_insert_with(|| TagDetails {
                id: row.tag_id,
                label: row.tag_label.clone(),
                allowed_categories: Vec::new(),
                usages: row.usages,
            });

            if let (Some(cat_id), Some(cat_name)) = (row.category_id, row.category_name.clone()) {
                tag.allowed_categories.push(Category {
                    id: cat_id,
                    name: cat_name,
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
}
