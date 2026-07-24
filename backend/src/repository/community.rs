use anyhow::Result;
use chrono::{DateTime, Local};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::community::{create_community::CreateCommunityDto, update_community::UpdateCommunityDto},
    entity::{
        community::{
            Community, CommunityDataVisibility, CommunityInviteCode, CommunityMember,
            CommunityMemberRole, CommunityVisibilityType,
        },
        visibility::VisibilityFlags,
    },
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

#[derive(sqlx::FromRow, Debug)]
struct CommunityMemberRow {
    id: Uuid,
    community_id: Uuid,
    user_id: String,
    role: CommunityMemberRole,
    joined_at: DateTime<Local>,
}

impl From<CommunityMemberRow> for CommunityMember {
    fn from(row: CommunityMemberRow) -> Self {
        Self {
            id: row.id,
            community_id: row.community_id,
            user_id: row.user_id,
            role: row.role,
            joined_at: row.joined_at,
        }
    }
}

const COMMUNITY_MEMBER_COLUMNS: &str = "id, community_id, user_id, role, joined_at";

#[derive(sqlx::FromRow, Debug)]
pub struct CommunityMemberWithUserRow {
    pub id: Uuid,
    pub role: CommunityMemberRole,
    pub joined_at: DateTime<Local>,
    pub user_id: String,
    pub username: String,
    pub avatar_thumb_url: Option<String>,
    pub avatar_image_url: Option<String>,
    pub visibility_flags: VisibilityFlags,
}

#[derive(sqlx::FromRow, Debug)]
struct CommunityInviteCodeRow {
    id: Uuid,
    community_id: Uuid,
    code: String,
    created_by: String,
    created_at: DateTime<Local>,
    updated_at: DateTime<Local>,
}

impl From<CommunityInviteCodeRow> for CommunityInviteCode {
    fn from(row: CommunityInviteCodeRow) -> Self {
        Self {
            id: row.id,
            community_id: row.community_id,
            code: row.code,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

const COMMUNITY_INVITE_CODE_COLUMNS: &str =
    "id, community_id, code, created_by, created_at, updated_at";

impl CommunityRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(owner_id = %owner_id, community_name = %dto.name))]
    pub async fn create_with_owner_membership(
        &self,
        dto: CreateCommunityDto,
        owner_id: &str,
    ) -> Result<Community> {
        let mut tx = self.db_conn.get_pool().begin().await?;

        let community_query = format!(
            r#"
                INSERT INTO "community" (name, description, avatar_url, visibility_type, data_visibility, owner_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING {COMMUNITY_COLUMNS}
            "#
        );

        let community_row = sqlx::query_as::<_, CommunityRow>(&community_query)
            .bind(dto.name)
            .bind(dto.description)
            .bind(dto.avatar_url)
            .bind(dto.visibility_type)
            .bind(dto.data_visibility)
            .bind(owner_id)
            .fetch_one(tx.as_mut())
            .await?;

        sqlx::query(
            r#"INSERT INTO "community_member" (community_id, user_id, role) VALUES ($1, $2, $3)"#,
        )
        .bind(community_row.id)
        .bind(owner_id)
        .bind(CommunityMemberRole::Owner)
        .execute(tx.as_mut())
        .await?;

        tx.commit().await?;

        Ok(community_row.into())
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

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn list_for_member(&self, user_id: &str) -> Result<Vec<Community>> {
        let columns = COMMUNITY_COLUMNS
            .split(", ")
            .map(|col| format!("c.{col}"))
            .collect::<Vec<_>>()
            .join(", ");

        let query = format!(
            r#"
                SELECT {columns}
                FROM "community" c
                JOIN "community_member" cm ON cm.community_id = c.id
                WHERE cm.user_id = $1 AND c.archived_at IS NULL
                ORDER BY cm.joined_at DESC
            "#
        );

        let rows = sqlx::query_as::<_, CommunityRow>(&query)
            .bind(user_id)
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows.into_iter().map(Community::from).collect())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, user_id = %user_id))]
    pub async fn find_membership(
        &self,
        community_id: Uuid,
        user_id: &str,
    ) -> Result<Option<CommunityMember>> {
        let query = format!(
            r#"SELECT {COMMUNITY_MEMBER_COLUMNS} FROM "community_member" WHERE community_id = $1 AND user_id = $2"#
        );

        let row = sqlx::query_as::<_, CommunityMemberRow>(&query)
            .bind(community_id)
            .bind(user_id)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityMember::from))
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, user_id = %user_id))]
    pub async fn add_member(
        &self,
        community_id: Uuid,
        user_id: &str,
        role: CommunityMemberRole,
    ) -> Result<CommunityMember> {
        let query = format!(
            r#"
                INSERT INTO "community_member" (community_id, user_id, role)
                VALUES ($1, $2, $3)
                RETURNING {COMMUNITY_MEMBER_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityMemberRow>(&query)
            .bind(community_id)
            .bind(user_id)
            .bind(role)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, user_id = %user_id))]
    pub async fn remove_member(&self, community_id: Uuid, user_id: &str) -> Result<()> {
        sqlx::query(r#"DELETE FROM "community_member" WHERE community_id = $1 AND user_id = $2"#)
            .bind(community_id)
            .bind(user_id)
            .execute(self.db_conn.get_pool())
            .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, limit = %limit, offset = %offset))]
    pub async fn list_members(
        &self,
        community_id: Uuid,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<CommunityMemberWithUserRow>> {
        let rows = sqlx::query_as::<_, CommunityMemberWithUserRow>(
            r#"
                SELECT
                    cm.id,
                    cm.role,
                    cm.joined_at,
                    u.id AS user_id,
                    u.displayname AS username,
                    ua.current_thumb_url AS avatar_thumb_url,
                    ua.current_image_url AS avatar_image_url,
                    u.visibility_flags
                FROM "community_member" cm
                JOIN "user" u ON u.id = cm.user_id
                LEFT JOIN user_avatar ua ON ua.user_id = u.id AND ua.is_enabled = true
                WHERE cm.community_id = $1
                ORDER BY cm.role DESC, cm.joined_at ASC
                LIMIT $2 OFFSET $3
            "#,
        )
        .bind(community_id)
        .bind(limit)
        .bind(offset)
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows)
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, user_id = %user_id))]
    pub async fn find_member_with_user(
        &self,
        community_id: Uuid,
        user_id: &str,
    ) -> Result<Option<CommunityMemberWithUserRow>> {
        let row = sqlx::query_as::<_, CommunityMemberWithUserRow>(
            r#"
                SELECT
                    cm.id,
                    cm.role,
                    cm.joined_at,
                    u.id AS user_id,
                    u.displayname AS username,
                    ua.current_thumb_url AS avatar_thumb_url,
                    ua.current_image_url AS avatar_image_url,
                    u.visibility_flags
                FROM "community_member" cm
                JOIN "user" u ON u.id = cm.user_id
                LEFT JOIN user_avatar ua ON ua.user_id = u.id AND ua.is_enabled = true
                WHERE cm.community_id = $1 AND cm.user_id = $2
            "#,
        )
        .bind(community_id)
        .bind(user_id)
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(row)
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn count_members(&self, community_id: Uuid) -> Result<i64> {
        let count: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(*) FROM "community_member" WHERE community_id = $1"#,
        )
        .bind(community_id)
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(count)
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn get_invite_code(&self, community_id: Uuid) -> Result<Option<CommunityInviteCode>> {
        let query = format!(
            r#"SELECT {COMMUNITY_INVITE_CODE_COLUMNS} FROM "community_invite_code" WHERE community_id = $1"#
        );

        let row = sqlx::query_as::<_, CommunityInviteCodeRow>(&query)
            .bind(community_id)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityInviteCode::from))
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn upsert_invite_code(
        &self,
        community_id: Uuid,
        code: &str,
        created_by: &str,
    ) -> Result<CommunityInviteCode> {
        let query = format!(
            r#"
                INSERT INTO "community_invite_code" (community_id, code, created_by)
                VALUES ($1, $2, $3)
                ON CONFLICT (community_id)
                DO UPDATE SET code = $2, updated_at = NOW()
                RETURNING {COMMUNITY_INVITE_CODE_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityInviteCodeRow>(&query)
            .bind(community_id)
            .bind(code)
            .bind(created_by)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(code = %code))]
    pub async fn find_community_by_invite_code(&self, code: &str) -> Result<Option<Community>> {
        let columns = COMMUNITY_COLUMNS
            .split(", ")
            .map(|col| format!("c.{col}"))
            .collect::<Vec<_>>()
            .join(", ");

        let query = format!(
            r#"
                SELECT {columns}
                FROM "community" c
                JOIN "community_invite_code" ic ON ic.community_id = c.id
                WHERE UPPER(ic.code) = UPPER($1) AND c.archived_at IS NULL
            "#
        );

        let row = sqlx::query_as::<_, CommunityRow>(&query)
            .bind(code)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(Community::from))
    }

    #[instrument(err, skip(self), fields(code = %code))]
    pub async fn code_in_use(&self, code: &str) -> Result<bool> {
        let count: i64 = sqlx::query_scalar(
            r#"SELECT COUNT(*) FROM "community_invite_code" WHERE UPPER(code) = UPPER($1)"#,
        )
        .bind(code)
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(count > 0)
    }
}
