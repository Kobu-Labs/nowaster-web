use anyhow::Result;
use chrono::{DateTime, Local};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::community::{create_community::CreateCommunityDto, update_community::UpdateCommunityDto},
    entity::community::{Community, CommunityDataVisibility, CommunityVisibilityType},
};

#[derive(Clone)]
pub struct CommunityRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Debug)]
struct CommunityRow {
    id: Uuid,
    name: String,
    description: Option<String>,
    avatar_url: Option<String>,
    visibility_type: CommunityVisibilityType,
    data_visibility: CommunityDataVisibility,
    owner_id: String,
    archived_at: Option<DateTime<Local>>,
    created_at: DateTime<Local>,
    updated_at: DateTime<Local>,
}

impl From<CommunityRow> for Community {
    fn from(row: CommunityRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            description: row.description,
            avatar_url: row.avatar_url,
            visibility_type: row.visibility_type,
            data_visibility: row.data_visibility,
            owner_id: row.owner_id,
            archived_at: row.archived_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

const COMMUNITY_COLUMNS: &str = "id, name, description, avatar_url, visibility_type, data_visibility, owner_id, archived_at, created_at, updated_at";

impl CommunityRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(owner_id = %owner_id, community_name = %dto.name))]
    pub async fn create(&self, dto: CreateCommunityDto, owner_id: &str) -> Result<Community> {
        let query = format!(
            r#"
                INSERT INTO "community" (name, description, avatar_url, visibility_type, data_visibility, owner_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING {COMMUNITY_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityRow>(&query)
            .bind(dto.name)
            .bind(dto.description)
            .bind(dto.avatar_url)
            .bind(dto.visibility_type)
            .bind(dto.data_visibility)
            .bind(owner_id)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(community_id = %id))]
    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Community>> {
        let query = format!(r#"SELECT {COMMUNITY_COLUMNS} FROM "community" WHERE id = $1"#);

        let row = sqlx::query_as::<_, CommunityRow>(&query)
            .bind(id)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(Community::from))
    }

    #[instrument(err, skip(self), fields(community_id = %dto.id))]
    pub async fn update(&self, dto: UpdateCommunityDto) -> Result<Community> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(r#"UPDATE "community" SET "#);

        let mut has_field = false;

        if let Some(name) = dto.name {
            query.push("name = ").push_bind(name);
            has_field = true;
        }

        if let Some(description) = dto.description {
            if has_field {
                query.push(", ");
            }
            query.push("description = ").push_bind(description);
            has_field = true;
        }

        if let Some(avatar_url) = dto.avatar_url {
            if has_field {
                query.push(", ");
            }
            query.push("avatar_url = ").push_bind(avatar_url);
            has_field = true;
        }

        if let Some(visibility_type) = dto.visibility_type {
            if has_field {
                query.push(", ");
            }
            query.push("visibility_type = ").push_bind(visibility_type);
            has_field = true;
        }

        if let Some(data_visibility) = dto.data_visibility {
            if has_field {
                query.push(", ");
            }
            query.push("data_visibility = ").push_bind(data_visibility);
            has_field = true;
        }

        if !has_field {
            return Err(anyhow::anyhow!("No fields to update"));
        }

        query.push(", updated_at = NOW() WHERE id = ");
        query.push_bind(dto.id);
        query.push(" AND archived_at IS NULL RETURNING ");
        query.push(COMMUNITY_COLUMNS);

        let row = query
            .build_query_as::<CommunityRow>()
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(community_id = %id))]
    pub async fn archive(&self, id: Uuid) -> Result<Community> {
        let query = format!(
            r#"
                UPDATE "community"
                SET archived_at = NOW(), updated_at = NOW()
                WHERE id = $1 AND archived_at IS NULL
                RETURNING {COMMUNITY_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityRow>(&query)
            .bind(id)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(owner_id = %owner_id))]
    pub async fn list_owned_by(&self, owner_id: &str) -> Result<Vec<Community>> {
        let query = format!(
            r#"
                SELECT {COMMUNITY_COLUMNS} FROM "community"
                WHERE owner_id = $1 AND archived_at IS NULL
                ORDER BY created_at DESC
            "#
        );

        let rows = sqlx::query_as::<_, CommunityRow>(&query)
            .bind(owner_id)
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows.into_iter().map(Community::from).collect())
    }
}
