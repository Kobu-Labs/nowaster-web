use anyhow::Result;
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::category::{create_category::CreateCategoryDto, filter_category::FilterCategoryDto},
    entity::category::Category,
};

#[derive(Clone)]
pub struct CategoryRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow)]
pub struct ReadCategoryRow {
    id: Uuid,
    name: String,
}

pub trait CategoryRepositoryTrait {
    async fn delete_category(&self, id: Uuid) -> Result<()>;
    async fn filter_categories(&self, filter: FilterCategoryDto) -> Result<Vec<Category>>;
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn upsert(&self, dto: CreateCategoryDto) -> Result<Category>;
    fn mapper(&self, row: ReadCategoryRow) -> Category;
}

impl CategoryRepositoryTrait for CategoryRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn upsert(&self, dto: CreateCategoryDto) -> Result<Category> {
        let row = sqlx::query_as!(
            ReadCategoryRow,
            r#"
                WITH inserted AS (
                    INSERT INTO category (name)
                    VALUES ($1)
                    ON CONFLICT (name) DO NOTHING
                    RETURNING category.id, category.name
                )
                SELECT i.id as "id!", i.name as "name!" FROM inserted i
                UNION ALL
                SELECT c.id, c.name FROM category c WHERE c.name = $1
            "#,
            dto.name
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    fn mapper(&self, row: ReadCategoryRow) -> Category {
        Category {
            id: row.id,
            name: row.name,
        }
    }

    async fn filter_categories(&self, filter: FilterCategoryDto) -> Result<Vec<Category>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            "
                SELECT category.id, category.name
                FROM category
                WHERE 1=1
            ",
        );

        if let Some(name) = filter.name {
            query.push("AND category.name = ").push_bind(name);
        }

        if let Some(id) = filter.id {
            query.push("AND category.id = ").push_bind(id);
        }

        let rows = query
            .build_query_as::<ReadCategoryRow>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows.into_iter().map(|row| self.mapper(row)).collect())
    }

    async fn delete_category(&self, id: Uuid) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM category
                WHERE category.id = $1
            "#,
            id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }
}
