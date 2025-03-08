use anyhow::Result;
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::category::{
        create_category::CreateCategoryDto, filter_category::FilterCategoryDto,
        update_category::UpdateCategoryDto,
    },
    entity::category::Category,
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct CategoryRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow)]
pub struct ReadCategoryRow {
    id: Uuid,
    name: String,
    created_by: String,
    color: String,
}

pub trait CategoryRepositoryTrait {
    async fn update(&self, dto: UpdateCategoryDto) -> Result<Category>;
    async fn find_by_id(&self, id: Uuid, actor: ClerkUser) -> Result<Category>;
    async fn delete_category(&self, id: Uuid) -> Result<()>;
    async fn filter_categories(
        &self,
        filter: FilterCategoryDto,
        actor: ClerkUser,
    ) -> Result<Vec<Category>>;
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn upsert(&self, dto: CreateCategoryDto, actor: ClerkUser) -> Result<Category>;
    fn mapper(&self, row: ReadCategoryRow) -> Category;
}

impl CategoryRepositoryTrait for CategoryRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn upsert(&self, dto: CreateCategoryDto, actor: ClerkUser) -> Result<Category> {
        let row = sqlx::query_as!(
            ReadCategoryRow,
            r#"
                WITH inserted AS (
                    INSERT INTO category (name, created_by, color)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (name, created_by) DO NOTHING
                    RETURNING category.id, category.name, category.created_by, category.color
                )
                SELECT i.id as "id!", i.name as "name!", i.created_by as "created_by!", i.color as "color!" FROM inserted i
                UNION ALL
                SELECT c.id, c.name, c.created_by, c.color FROM category c WHERE c.name = $1 and c.created_by = $2
            "#,
            dto.name,
            actor.user_id,
            dto.color
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    fn mapper(&self, row: ReadCategoryRow) -> Category {
        Category {
            id: row.id,
            name: row.name,
            created_by: row.created_by,
            color: row.color,
        }
    }

    async fn filter_categories(
        &self,
        filter: FilterCategoryDto,
        actor: ClerkUser,
    ) -> Result<Vec<Category>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            "
                SELECT category.id, category.name, category.created_by, category.color
                FROM category
                WHERE category.created_by = 
            ",
        );
        query.push_bind(actor.user_id);

        if let Some(name) = filter.name {
            query.push(" AND category.name = ").push_bind(name);
        }

        if let Some(id) = filter.id {
            query.push(" AND category.id = ").push_bind(id);
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

    async fn find_by_id(&self, id: Uuid, actor: ClerkUser) -> Result<Category> {
        let result = self
            .filter_categories(
                FilterCategoryDto {
                    id: Some(id),
                    name: None,
                },
                actor,
            )
            .await?;

        if let Some(category) = result.first() {
            return Ok(category.clone());
        }
        Err(anyhow::anyhow!("Category not found"))
    }

    async fn update(&self, dto: UpdateCategoryDto) -> Result<Category> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                UPDATE "category" SET
            "#,
        );

        let mut fields = vec![];

        if let Some(label) = dto.name {
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

        query.push(" WHERE id = ");
        query.push_bind(dto.id);
        query.push(" RETURNING category.id, category.name, category.created_by, category.color");

        if fields.is_empty() {
            return Err(anyhow::anyhow!("No fields to update"));
        }

        let row = query
            .build_query_as::<ReadCategoryRow>()
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(self.mapper(row))
    }
}
