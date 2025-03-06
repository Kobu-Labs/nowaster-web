use anyhow::{Ok, Result};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::tag::{create_tag::CreateTagDto, filter_tags::TagFilterDto},
    entity::tag::Tag,
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

pub trait TagRepositoryTrait {
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn upsert(&self, dto: CreateTagDto) -> Result<Tag>;
    fn mapper(&self, row: ReadTagRow) -> Tag;
    async fn filter_tags(&self, filter: TagFilterDto) -> Result<Vec<Tag>>;
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

    async fn upsert(&self, dto: CreateTagDto) -> Result<Tag> {
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

        Ok(self.mapper(row))
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

    async fn filter_tags(&self, filter: TagFilterDto) -> Result<Vec<Tag>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            "
                SELECT tag.id, tag.label
                FROM tag
                WHERE 1=1
            ",
        );

        if let Some(id) = filter.id {
            query.push(" and tag.id = ").push_bind(id);
        }

        if let Some(label) = filter.label {
            query.push(" and tag.label = ").push_bind(label);
        }

        let result = query
            .build_query_as::<ReadTagRow>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(result.into_iter().map(|row| self.mapper(row)).collect())
    }

    fn mapper(&self, row: ReadTagRow) -> Tag {
        Tag {
            id: row.id,
            label: row.label,
        }
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
