use anyhow::Result;
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    entity::visibility::VisibilityFlags,
};

#[derive(Clone)]
pub struct CommunityDashboardRepository {
    db_conn: Arc<Database>,
}

#[derive(Clone, sqlx::FromRow)]
pub struct CategoryBreakdownRow {
    pub tracked_category_id: Uuid,
    pub name: String,
    pub color: String,
    pub total_minutes: f64,
    pub session_count: i64,
}

#[derive(Clone, sqlx::FromRow)]
pub struct MemberContributionRow {
    pub user_id: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub visibility_flags: VisibilityFlags,
    pub total_minutes: f64,
    pub session_count: i64,
}

#[derive(Clone, sqlx::FromRow)]
struct TotalMinutesRow {
    total_minutes: f64,
    session_count: i64,
}

impl CommunityDashboardRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn get_total_minutes(&self, community_id: Uuid) -> Result<(f64, i64)> {
        let row = sqlx::query_as::<_, TotalMinutesRow>(
            r#"
                WITH qualifying_sessions AS (
                    SELECT DISTINCT s.id, s.start_time, s.end_time
                    FROM session s
                    JOIN community_category_mapping ccm
                        ON ccm.personal_category_id = s.category_id
                        AND ccm.user_id = s.user_id
                    WHERE ccm.community_id = $1
                      AND s.end_time IS NOT NULL
                )
                SELECT
                    COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))) / 60, 0) AS total_minutes,
                    COUNT(*) AS session_count
                FROM qualifying_sessions
            "#,
        )
        .bind(community_id)
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok((row.total_minutes, row.session_count))
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn get_category_breakdown(
        &self,
        community_id: Uuid,
    ) -> Result<Vec<CategoryBreakdownRow>> {
        let rows = sqlx::query_as::<_, CategoryBreakdownRow>(
            r#"
                SELECT
                    tc.id AS tracked_category_id,
                    tc.name,
                    tc.color,
                    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))) / 60, 0) AS total_minutes,
                    COUNT(s.id) AS session_count
                FROM community_tracked_category tc
                LEFT JOIN community_category_mapping ccm
                    ON ccm.tracked_category_id = tc.id
                LEFT JOIN session s
                    ON s.category_id = ccm.personal_category_id
                    AND s.user_id = ccm.user_id
                    AND s.end_time IS NOT NULL
                WHERE tc.community_id = $1
                GROUP BY tc.id, tc.name, tc.color
                ORDER BY total_minutes DESC, tc.name ASC
            "#,
        )
        .bind(community_id)
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows)
    }

    #[instrument(err, skip(self), fields(community_id = %community_id))]
    pub async fn get_member_contributions(
        &self,
        community_id: Uuid,
    ) -> Result<Vec<MemberContributionRow>> {
        let rows = sqlx::query_as::<_, MemberContributionRow>(
            r#"
                WITH qualifying_sessions AS (
                    SELECT DISTINCT s.id, s.user_id, s.start_time, s.end_time
                    FROM session s
                    JOIN community_category_mapping ccm
                        ON ccm.personal_category_id = s.category_id
                        AND ccm.user_id = s.user_id
                    WHERE ccm.community_id = $1
                      AND s.end_time IS NOT NULL
                )
                SELECT
                    cm.user_id,
                    u.displayname AS username,
                    u.avatar_url,
                    u.visibility_flags,
                    COALESCE(SUM(EXTRACT(EPOCH FROM (qs.end_time - qs.start_time))) / 60, 0) AS total_minutes,
                    COUNT(qs.id) AS session_count
                FROM community_member cm
                JOIN "user" u ON u.id = cm.user_id
                LEFT JOIN qualifying_sessions qs ON qs.user_id = cm.user_id
                WHERE cm.community_id = $1
                GROUP BY cm.user_id, u.displayname, u.avatar_url, u.visibility_flags
                ORDER BY total_minutes DESC, u.displayname ASC
            "#,
        )
        .bind(community_id)
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows)
    }
}
