use anyhow::{Ok, Result};
use indexmap::IndexMap;
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::{
        category::read_category::ReadCategoryDto,
        tag::{
            create_tag::{CreateTagDto, UpdateTagDto},
            filter_tags::TagFilterDto,
        },
    },
    entity::{category::Category, tag::TagDetails},
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct TagRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow)]
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
}
