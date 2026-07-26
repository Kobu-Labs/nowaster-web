use crate::{
    config::database::{Database, DatabaseTrait},
    dto::statistics::daily_activity::DailyActivity,
    router::clerk::Actor,
};
use anyhow::Result;
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::OnceCell;

static VALID_TIMEZONES: OnceCell<HashSet<String>> = OnceCell::const_new();

#[derive(Clone)]
pub struct StatisticsRepository {
    db_conn: Arc<Database>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadColorsDto {
    pub category_colors: Vec<(String, String)>,
    pub tag_colors: Vec<(String, String)>,
}

impl StatisticsRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    pub async fn get_colors(&self, actor: &Actor) -> Result<ReadColorsDto> {
        let tag_colors = crate::named_query!(
            "stats_tag_colors",
            sqlx::query_as::<_, (String, String)>(
                r#"
                SELECT tag.color, tag.label
                FROM tag
                WHERE tag.created_by = $1
            "#,
            )
            .bind(&actor.user_id)
            .fetch_all(self.db_conn.get_pool())
        )?;

        let category_colors = crate::named_query!(
            "stats_category_colors",
            sqlx::query_as::<_, (String, String)>(
                r#"
                SELECT category.color, category.name
                FROM category
                WHERE category.created_by = $1
            "#,
            )
            .bind(&actor.user_id)
            .fetch_all(self.db_conn.get_pool())
        )?;

        Ok(ReadColorsDto {
            category_colors,
            tag_colors,
        })
    }

    pub async fn get_amount_of_sessions(&self, actor: &Actor) -> Result<u16> {
        let count: i64 = crate::named_query!(
            "stats_session_count",
            sqlx::query_scalar!(
                r#"
                SELECT COUNT(*) as "count!"
                FROM session
                WHERE session.user_id = $1
            "#,
                actor.user_id,
            )
            .fetch_one(self.db_conn.get_pool())
        )?;

        Ok(count as u16)
    }

    pub async fn get_total_session_time(&self, actor: &Actor) -> Result<f64> {
        let sum: Option<f64> = crate::named_query!(
            "stats_total_session_time",
            sqlx::query_scalar!(
                r#"
                SELECT CAST(SUM(EXTRACT(EPOCH FROM (end_time - start_time))) / 60 AS FLOAT8) as "sum"
                FROM session
                WHERE session.user_id = $1
            "#,
                actor.user_id,
            )
            .fetch_one(self.db_conn.get_pool())
        )?;

        Ok(sum.unwrap_or(0 as f64))
    }

    pub async fn get_current_streak(&self, actor: &Actor) -> Result<u16> {
        let result = crate::named_query!(
            "stats_current_streak",
            sqlx::query_scalar!(
                r#"
                WITH RECURSIVE consecutive_days AS (
                    SELECT CAST(CURRENT_DATE AS DATE) AS date_day, 1 AS consecutive_count
                    UNION ALL
                    SELECT CAST(date_day - INTERVAL '1 day' AS DATE), consecutive_count + 1
                    FROM consecutive_days
                    WHERE EXISTS (
                        SELECT 1
                        FROM session
                        WHERE CAST(start_time AS DATE) = date_day - INTERVAL '1 day'
                        AND session.user_id = $1
                    )
                )

                SELECT MAX(consecutive_count) AS consecutive_days_count
                FROM consecutive_days;
            "#,
                actor.user_id,
            )
            .fetch_one(self.db_conn.get_pool())
        )?;

        Ok(result.unwrap_or(0) as u16)
    }

    // INFO: AT TIME ZONE accepts a bound parameter, so this never risks SQL
    // injection even before validation - the validation exists purely to
    // silently fall back to UTC on an unrecognized zone, per product decision.
    //
    // pg_timezone_names doesn't change at runtime, so the valid set is loaded
    // once per process and cached instead of round-tripping to Postgres on
    // every daily-activity request.
    async fn resolve_timezone<'a>(&self, timezone: Option<&'a str>) -> Result<&'a str> {
        let requested_tz = timezone.unwrap_or("UTC");

        let valid_timezones = VALID_TIMEZONES
            .get_or_try_init(|| async {
                let rows = crate::named_query!(
                    "stats_valid_timezones",
                    sqlx::query_scalar!(r#"SELECT name AS "name!" FROM pg_timezone_names"#)
                        .fetch_all(self.db_conn.get_pool())
                )?;
                Ok::<_, anyhow::Error>(rows.into_iter().collect::<HashSet<_>>())
            })
            .await?;

        Ok(if valid_timezones.contains(requested_tz) {
            requested_tz
        } else {
            "UTC"
        })
    }

    pub async fn get_daily_activity(
        &self,
        actor: &Actor,
        timezone: Option<&str>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<Vec<DailyActivity>> {
        let tz = self.resolve_timezone(timezone).await?;

        // Defaults preserve the original rolling-last-year behavior when the
        // caller doesn't need an arbitrary window (e.g. a specific past year).
        let range_start = from.unwrap_or_else(|| Utc::now() - Duration::days(370));
        let range_end = to.unwrap_or_else(Utc::now);

        let rows = crate::named_query!(
            "stats_daily_activity",
            sqlx::query!(
                r#"
                SELECT
                    (session.start_time AT TIME ZONE $2)::date AS "day!",
                    CAST(COALESCE(SUM(EXTRACT(EPOCH FROM (session.end_time - session.start_time)) / 60), 0) AS FLOAT8) AS "minutes!",
                    COUNT(*) AS "session_count!"
                FROM session
                WHERE session.user_id = $1
                    AND session.start_time >= $3
                    AND session.start_time < $4
                GROUP BY 1
                ORDER BY 1
            "#,
                actor.user_id,
                tz,
                range_start,
                range_end,
            )
            .fetch_all(self.db_conn.get_pool())
        )?;

        Ok(rows
            .into_iter()
            .map(|row| DailyActivity {
                date: row.day,
                minutes: row.minutes,
                session_count: row.session_count,
            })
            .collect())
    }
}
