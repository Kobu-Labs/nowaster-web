use anyhow::Result;
use chrono::{DateTime, Local};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    entity::community_category::{CommunityCategoryMapping, CommunityTrackedCategory},
};

#[derive(Clone)]
pub struct CommunityCategoryRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Debug)]
struct TrackedCategoryRow {
    id: Uuid,
    community_id: Uuid,
    name: String,
    color: String,
    created_at: DateTime<Local>,
    updated_at: DateTime<Local>,
}

impl From<TrackedCategoryRow> for CommunityTrackedCategory {
    fn from(row: TrackedCategoryRow) -> Self {
        Self {
            id: row.id,
            community_id: row.community_id,
            name: row.name,
            color: row.color,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

const TRACKED_CATEGORY_COLUMNS: &str = "id, community_id, name, color, created_at, updated_at";

#[derive(sqlx::FromRow, Debug)]
struct MappingRow {
    id: Uuid,
    community_id: Uuid,
    tracked_category_id: Uuid,
    user_id: String,
    personal_category_id: Uuid,
    created_at: DateTime<Local>,
}

impl From<MappingRow> for CommunityCategoryMapping {
    fn from(row: MappingRow) -> Self {
        Self {
            id: row.id,
            community_id: row.community_id,
            tracked_category_id: row.tracked_category_id,
            user_id: row.user_id,
            personal_category_id: row.personal_category_id,
            created_at: row.created_at,
        }
    }
}

const MAPPING_COLUMNS: &str =
    "id, community_id, tracked_category_id, user_id, personal_category_id, created_at";

#[derive(sqlx::FromRow, Debug)]
pub struct MappingWithDetailsRow {
    pub id: Uuid,
    pub created_at: DateTime<Local>,
    pub tracked_category_id: Uuid,
    pub tracked_category_community_id: Uuid,
    pub tracked_category_name: String,
    pub tracked_category_color: String,
    pub tracked_category_mapped_member_count: i64,
    pub personal_category_id: Uuid,
    pub personal_category_name: String,
    pub personal_category_color: String,
    pub personal_category_last_used_at: DateTime<Local>,
}

impl CommunityCategoryRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, name = %name))]
    pub async fn create_tracked_category(
        &self,
        community_id: Uuid,
        name: &str,
        color: &str,
    ) -> Result<CommunityTrackedCategory> {
        let query = format!(
            r#"
                INSERT INTO "community_tracked_category" (community_id, name, color)
                VALUES ($1, $2, $3)
                RETURNING {TRACKED_CATEGORY_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, TrackedCategoryRow>(&query)
            .bind(community_id)
            .bind(name)
            .bind(color)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, name = %name))]
    pub async fn find_tracked_category_by_name(
        &self,
        community_id: Uuid,
        name: &str,
    ) -> Result<Option<CommunityTrackedCategory>> {
        let query = format!(
            r#"SELECT {TRACKED_CATEGORY_COLUMNS} FROM "community_tracked_category" WHERE community_id = $1 AND name = $2"#
        );

        let row = sqlx::query_as::<_, TrackedCategoryRow>(&query)
            .bind(community_id)
            .bind(name)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityTrackedCategory::from))
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %id))]
    pub async fn update_tracked_category(
        &self,
        id: Uuid,
        name: Option<&str>,
        color: Option<&str>,
    ) -> Result<CommunityTrackedCategory> {
        use sqlx::{Postgres, QueryBuilder};

        let mut query: QueryBuilder<'_, Postgres> =
            QueryBuilder::new(r#"UPDATE "community_tracked_category" SET "#);

        let mut has_field = false;

        if let Some(name) = name {
            query.push("name = ").push_bind(name.to_string());
            has_field = true;
        }

        if let Some(color) = color {
            if has_field {
                query.push(", ");
            }
            query.push("color = ").push_bind(color.to_string());
            has_field = true;
        }

        if !has_field {
            return Err(anyhow::anyhow!("No fields to update"));
        }

        query.push(", updated_at = NOW() WHERE id = ");
        query.push_bind(id);
        query.push(" RETURNING ");
        query.push(TRACKED_CATEGORY_COLUMNS);

        let row = query
            .build_query_as::<TrackedCategoryRow>()
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %id))]
    pub async fn delete_tracked_category(&self, id: Uuid) -> Result<()> {
        sqlx::query(r#"DELETE FROM "community_tracked_category" WHERE id = $1"#)
            .bind(id)
            .execute(self.db_conn.get_pool())
            .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %id))]
    pub async fn find_tracked_category(
        &self,
        id: Uuid,
    ) -> Result<Option<CommunityTrackedCategory>> {
        let query = format!(
            r#"SELECT {TRACKED_CATEGORY_COLUMNS} FROM "community_tracked_category" WHERE id = $1"#
        );

        let row = sqlx::query_as::<_, TrackedCategoryRow>(&query)
            .bind(id)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityTrackedCategory::from))
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn list_tracked_categories(
        &self,
        community_id: Uuid,
    ) -> Result<Vec<CommunityTrackedCategory>> {
        let query = format!(
            r#"SELECT {TRACKED_CATEGORY_COLUMNS} FROM "community_tracked_category" WHERE community_id = $1 ORDER BY name ASC"#
        );

        let rows = sqlx::query_as::<_, TrackedCategoryRow>(&query)
            .bind(community_id)
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows
            .into_iter()
            .map(CommunityTrackedCategory::from)
            .collect())
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %id))]
    pub async fn count_mapped_members(&self, id: Uuid) -> Result<i64> {
        let count: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(DISTINCT user_id) FROM "community_category_mapping" WHERE tracked_category_id = $1"#,
        )
        .bind(id)
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(count)
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %tracked_category_id, personal_category_id = %personal_category_id))]
    pub async fn create_mapping(
        &self,
        community_id: Uuid,
        tracked_category_id: Uuid,
        user_id: &str,
        personal_category_id: Uuid,
    ) -> Result<CommunityCategoryMapping> {
        let query = format!(
            r#"
                INSERT INTO "community_category_mapping" (community_id, tracked_category_id, user_id, personal_category_id)
                VALUES ($1, $2, $3, $4)
                RETURNING {MAPPING_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, MappingRow>(&query)
            .bind(community_id)
            .bind(tracked_category_id)
            .bind(user_id)
            .bind(personal_category_id)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %tracked_category_id, personal_category_id = %personal_category_id))]
    pub async fn find_mapping_by_categories(
        &self,
        tracked_category_id: Uuid,
        user_id: &str,
        personal_category_id: Uuid,
    ) -> Result<Option<CommunityCategoryMapping>> {
        let query = format!(
            r#"SELECT {MAPPING_COLUMNS} FROM "community_category_mapping" WHERE tracked_category_id = $1 AND user_id = $2 AND personal_category_id = $3"#
        );

        let row = sqlx::query_as::<_, MappingRow>(&query)
            .bind(tracked_category_id)
            .bind(user_id)
            .bind(personal_category_id)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityCategoryMapping::from))
    }

    #[instrument(err, skip(self), fields(mapping_id = %id))]
    pub async fn delete_mapping(&self, id: Uuid, user_id: &str) -> Result<()> {
        sqlx::query(r#"DELETE FROM "community_category_mapping" WHERE id = $1 AND user_id = $2"#)
            .bind(id)
            .bind(user_id)
            .execute(self.db_conn.get_pool())
            .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(mapping_id = %id))]
    pub async fn find_mapping(&self, id: Uuid) -> Result<Option<CommunityCategoryMapping>> {
        let query =
            format!(r#"SELECT {MAPPING_COLUMNS} FROM "community_category_mapping" WHERE id = $1"#);

        let row = sqlx::query_as::<_, MappingRow>(&query)
            .bind(id)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityCategoryMapping::from))
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, user_id = %user_id))]
    pub async fn list_mappings_for_member(
        &self,
        community_id: Uuid,
        user_id: &str,
    ) -> Result<Vec<MappingWithDetailsRow>> {
        let rows = sqlx::query_as::<_, MappingWithDetailsRow>(
            r#"
                SELECT
                    ccm.id,
                    ccm.created_at,
                    tc.id AS tracked_category_id,
                    tc.community_id AS tracked_category_community_id,
                    tc.name AS tracked_category_name,
                    tc.color AS tracked_category_color,
                    (
                        SELECT COUNT(DISTINCT inner_ccm.user_id)
                        FROM "community_category_mapping" inner_ccm
                        WHERE inner_ccm.tracked_category_id = tc.id
                    ) AS tracked_category_mapped_member_count,
                    pc.id AS personal_category_id,
                    pc.name AS personal_category_name,
                    pc.color AS personal_category_color,
                    pc.last_used_at AS personal_category_last_used_at
                FROM "community_category_mapping" ccm
                JOIN "community_tracked_category" tc ON tc.id = ccm.tracked_category_id
                JOIN "category" pc ON pc.id = ccm.personal_category_id
                WHERE ccm.community_id = $1 AND ccm.user_id = $2
                ORDER BY tc.name ASC, pc.name ASC
            "#,
        )
        .bind(community_id)
        .bind(user_id)
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows)
    }
}
