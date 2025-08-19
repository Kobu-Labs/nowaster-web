use anyhow::Result;
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::category::{
        create_category::CreateCategoryDto,
        filter_category::FilterCategoryDto,
        read_category::{CategoryStatsDto, ReadCategoryDto, ReadCategoryWithSessionCountDto},
        update_category::UpdateCategoryDto,
    },
    entity::category::Category,
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct CategoryRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize)]
pub struct ReadCategoryRow {
    id: Uuid,
    name: String,
    created_by: String,
    color: String,
}

pub trait CategoryRepositoryTrait {
    async fn update(&self, dto: UpdateCategoryDto) -> Result<Category>;
    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Category>;
    async fn delete_category(&self, id: Uuid) -> Result<()>;
    async fn filter_categories(
        &self,
        filter: FilterCategoryDto,
        actor: Actor,
    ) -> Result<Vec<Category>>;
    async fn get_categories_with_session_count(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadCategoryWithSessionCountDto>>;
    async fn get_category_statistics(&self, actor: Actor) -> Result<CategoryStatsDto>;
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn upsert(&self, dto: CreateCategoryDto, actor: Actor) -> Result<Category>;
    fn mapper(&self, row: ReadCategoryRow) -> Category;
}

impl CategoryRepositoryTrait for CategoryRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn upsert(&self, dto: CreateCategoryDto, actor: Actor) -> Result<Category> {
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
        actor: Actor,
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

        query.push(" ORDER BY category.last_used_at DESC NULLS LAST");

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

    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Category> {
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

        if let Some(name) = dto.name {
            fields.push(("name", name));
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

    async fn get_categories_with_session_count(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadCategoryWithSessionCountDto>> {
        let rows = sqlx::query_as!(
            ReadCategoryWithSessionCountDto,
            r#"
                SELECT 
                    c.id,
                    c.name,
                    c.color,
                    COALESCE(COUNT(s.id),0) as "session_count!"
                FROM category c
                LEFT JOIN session s ON c.id = s.category_id AND s.user_id = $1
                WHERE c.created_by = $1
                GROUP BY c.id
                ORDER BY COALESCE(COUNT(s.id),0) DESC
            "#,
            actor.user_id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows)
    }

    async fn get_category_statistics(&self, actor: Actor) -> Result<CategoryStatsDto> {
        // First get basic stats
        let basic_stats = sqlx::query!(
            r#"
                SELECT 
                    COUNT(DISTINCT c.id) as "total_categories!",
                    COUNT(s.id) as "total_sessions!",
                    CAST(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))) / 60 AS FLOAT8) as total_time_minutes
                FROM category c
                LEFT JOIN session s ON c.id = s.category_id AND s.user_id = $1
                WHERE c.created_by = $1
            "#,
            actor.user_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        // Get most used category separately
        let most_used = sqlx::query!(
            r#"
                SELECT 
                    c.id, c.name, c.color
                FROM category c
                LEFT JOIN session s ON c.id = s.category_id AND s.user_id = $1
                WHERE c.created_by = $1
                GROUP BY c.id, c.name, c.color
                ORDER BY COUNT(s.id) DESC
                LIMIT 1
            "#,
            actor.user_id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        let most_used_category = most_used.map(|row| ReadCategoryDto {
            id: row.id,
            name: row.name,
            color: row.color,
        });

        let average_sessions_per_category = if basic_stats.total_categories > 0 {
            basic_stats.total_sessions as f64 / basic_stats.total_categories as f64
        } else {
            0.0
        };

        Ok(CategoryStatsDto {
            total_categories: basic_stats.total_categories,
            total_sessions: basic_stats.total_sessions,
            total_time_minutes: basic_stats.total_time_minutes,
            average_sessions_per_category,
            most_used_category,
        })
    }
}
