use crate::config::database::{Database, DatabaseTrait};
use anyhow::Result;
use std::sync::Arc;

#[derive(Clone)]
pub struct StatisticsRepository {
    db_conn: Arc<Database>,
}

impl StatisticsRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    pub async fn get_amount_of_sessions(&self) -> Result<u16> {
        let count: i64 = sqlx::query_scalar(
            r#"
                SELECT COUNT(*) as "count!"
                FROM session
            "#,
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(count as u16)
    }

    pub async fn get_total_session_time(&self) -> Result<f64> {
        let sum: f64 = sqlx::query_scalar(
            r#"
                SELECT CAST(SUM(EXTRACT(EPOCH FROM (end_time - start_time))) / 60 AS FLOAT8) as "sum!"
                FROM session
            "#,
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(sum)
    }

    pub async fn get_current_streak(&self) -> Result<u16> {
        let result: i32 = sqlx::query_scalar(
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
                    )
                )

                SELECT MAX(consecutive_count) AS consecutive_days_count
                FROM consecutive_days;
            "#,
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(result as u16)
    }
}
