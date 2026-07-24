use anyhow::Result;
use chrono::{DateTime, Local};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    entity::community::{CommunityInvite, CommunityInviteStatus, CommunityInviteType},
};

#[derive(Clone)]
pub struct CommunityInviteRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Debug)]
struct CommunityInviteRow {
    id: Uuid,
    community_id: Uuid,
    invite_type: CommunityInviteType,
    status: CommunityInviteStatus,
    invited_user_id: Option<String>,
    code: Option<String>,
    max_uses: Option<i32>,
    use_count: i32,
    created_by: String,
    expires_at: Option<DateTime<Local>>,
    responded_at: Option<DateTime<Local>>,
    created_at: DateTime<Local>,
}

impl From<CommunityInviteRow> for CommunityInvite {
    fn from(row: CommunityInviteRow) -> Self {
        Self {
            id: row.id,
            community_id: row.community_id,
            invite_type: row.invite_type,
            status: row.status,
            invited_user_id: row.invited_user_id,
            code: row.code,
            max_uses: row.max_uses,
            use_count: row.use_count,
            created_by: row.created_by,
            expires_at: row.expires_at,
            responded_at: row.responded_at,
            created_at: row.created_at,
        }
    }
}

const COMMUNITY_INVITE_COLUMNS: &str = "id, community_id, invite_type, status, invited_user_id, code, max_uses, use_count, created_by, expires_at, responded_at, created_at";

impl CommunityInviteRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, invited_user_id = %invited_user_id))]
    pub async fn create_direct_invite(
        &self,
        community_id: Uuid,
        invited_user_id: &str,
        created_by: &str,
    ) -> Result<CommunityInvite> {
        let query = format!(
            r#"
                INSERT INTO "community_invite" (community_id, invite_type, invited_user_id, created_by)
                VALUES ($1, 'direct', $2, $3)
                RETURNING {COMMUNITY_INVITE_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(community_id)
            .bind(invited_user_id)
            .bind(created_by)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn create_link_invite(
        &self,
        community_id: Uuid,
        code: &str,
        created_by: &str,
        expires_at: Option<DateTime<Local>>,
        max_uses: Option<i32>,
    ) -> Result<CommunityInvite> {
        let query = format!(
            r#"
                INSERT INTO "community_invite" (community_id, invite_type, code, created_by, expires_at, max_uses)
                VALUES ($1, 'link', $2, $3, $4, $5)
                RETURNING {COMMUNITY_INVITE_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(community_id)
            .bind(code)
            .bind(created_by)
            .bind(expires_at)
            .bind(max_uses)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(invite_id = %invite_id))]
    pub async fn get_invite(&self, invite_id: Uuid) -> Result<Option<CommunityInvite>> {
        let query =
            format!(r#"SELECT {COMMUNITY_INVITE_COLUMNS} FROM "community_invite" WHERE id = $1"#);

        let row = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(invite_id)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityInvite::from))
    }

    #[instrument(err, skip(self), fields(code = %code))]
    pub async fn get_invite_by_code(&self, code: &str) -> Result<Option<CommunityInvite>> {
        let query = format!(
            r#"SELECT {COMMUNITY_INVITE_COLUMNS} FROM "community_invite" WHERE UPPER(code) = UPPER($1)"#
        );

        let row = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(code)
            .fetch_optional(self.db_conn.get_pool())
            .await?;

        Ok(row.map(CommunityInvite::from))
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn list_incoming_invites(&self, user_id: &str) -> Result<Vec<CommunityInvite>> {
        let query = format!(
            r#"
                SELECT {COMMUNITY_INVITE_COLUMNS} FROM "community_invite"
                WHERE invite_type = 'direct' AND invited_user_id = $1 AND status = 'pending'
                ORDER BY created_at DESC
            "#
        );

        let rows = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(user_id)
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows.into_iter().map(CommunityInvite::from).collect())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn list_community_invites(&self, community_id: Uuid) -> Result<Vec<CommunityInvite>> {
        let query = format!(
            r#"
                SELECT {COMMUNITY_INVITE_COLUMNS} FROM "community_invite"
                WHERE community_id = $1
                ORDER BY created_at DESC
            "#
        );

        let rows = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(community_id)
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows.into_iter().map(CommunityInvite::from).collect())
    }

    #[instrument(err, skip(self), fields(invite_id = %invite_id, status = ?status))]
    pub async fn update_invite_status(
        &self,
        invite_id: Uuid,
        status: CommunityInviteStatus,
    ) -> Result<CommunityInvite> {
        let query = format!(
            r#"
                UPDATE "community_invite"
                SET status = $2, responded_at = NOW()
                WHERE id = $1
                RETURNING {COMMUNITY_INVITE_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(invite_id)
            .bind(status)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }

    #[instrument(err, skip(self), fields(invite_id = %invite_id))]
    pub async fn increment_use_count(&self, invite_id: Uuid) -> Result<CommunityInvite> {
        let query = format!(
            r#"
                UPDATE "community_invite"
                SET use_count = use_count + 1
                WHERE id = $1
                RETURNING {COMMUNITY_INVITE_COLUMNS}
            "#
        );

        let row = sqlx::query_as::<_, CommunityInviteRow>(&query)
            .bind(invite_id)
            .fetch_one(self.db_conn.get_pool())
            .await?;

        Ok(row.into())
    }
}
