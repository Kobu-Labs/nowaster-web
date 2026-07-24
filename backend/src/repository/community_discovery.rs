use anyhow::Result;
use chrono::{DateTime, Local};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::community::discover::DiscoverySort,
};

#[derive(Clone)]
pub struct CommunityDiscoveryRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Debug)]
pub struct CommunitySearchRow {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub member_count: i32,
    pub created_at: DateTime<Local>,
    pub recent_minutes: f64,
    pub is_member: bool,
    pub total_count: i64,
}

pub struct DiscoverCommunitiesFilter {
    pub query: Option<String>,
    pub category: Option<String>,
    pub sort: DiscoverySort,
    pub limit: i64,
    pub offset: i64,
}

impl CommunityDiscoveryRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self, filter), fields(query = ?filter.query, sort = ?filter.sort))]
    pub async fn search_public_communities(
        &self,
        filter: DiscoverCommunitiesFilter,
        actor_id: &str,
    ) -> Result<Vec<CommunitySearchRow>> {
        let order_by = match filter.sort {
            DiscoverySort::Members => "c.member_count DESC, c.created_at DESC",
            DiscoverySort::Newest => "c.created_at DESC",
            DiscoverySort::Activity => "recent_minutes DESC, c.member_count DESC",
        };

        let query = format!(
            r#"
                WITH recent_activity AS (
                    SELECT
                        ccm.community_id,
                        COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60), 0)::float8 AS recent_minutes
                    FROM community_category_mapping ccm
                    JOIN session s
                        ON s.category_id = ccm.personal_category_id
                        AND s.user_id = ccm.user_id
                        AND s.start_time > now() - interval '30 days'
                        AND s.end_time IS NOT NULL
                    GROUP BY ccm.community_id
                )
                SELECT
                    c.id, c.name, c.description, c.avatar_url, c.member_count,
                    c.created_at,
                    COALESCE(ra.recent_minutes, 0) AS recent_minutes,
                    (m.user_id IS NOT NULL) AS is_member,
                    COUNT(*) OVER() AS total_count
                FROM "community" c
                LEFT JOIN recent_activity ra ON ra.community_id = c.id
                LEFT JOIN "community_member" m ON m.community_id = c.id AND m.user_id = $1
                WHERE c.visibility_type = 'public'
                    AND c.archived_at IS NULL
                    AND ($2::text IS NULL OR c.name ILIKE '%' || $2 || '%' OR c.description ILIKE '%' || $2 || '%')
                    AND ($3::text IS NULL OR EXISTS (
                        SELECT 1 FROM "community_tracked_category" tc
                        WHERE tc.community_id = c.id AND tc.name ILIKE '%' || $3 || '%'
                    ))
                ORDER BY {order_by}
                LIMIT $4 OFFSET $5
            "#
        );

        let rows = sqlx::query_as::<_, CommunitySearchRow>(&query)
            .bind(actor_id)
            .bind(&filter.query)
            .bind(&filter.category)
            .bind(filter.limit)
            .bind(filter.offset)
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows)
    }

    #[instrument(err, skip(self), fields(prefix = %prefix))]
    pub async fn list_distinct_tracked_category_names(
        &self,
        prefix: &str,
        limit: i64,
    ) -> Result<Vec<String>> {
        let names: Vec<String> = sqlx::query_scalar(
            r#"
                SELECT DISTINCT tc.name
                FROM "community_tracked_category" tc
                JOIN "community" c ON c.id = tc.community_id
                WHERE c.visibility_type = 'public'
                    AND c.archived_at IS NULL
                    AND tc.name ILIKE $1 || '%'
                ORDER BY tc.name
                LIMIT $2
            "#,
        )
        .bind(prefix)
        .bind(limit)
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(names)
    }
}
