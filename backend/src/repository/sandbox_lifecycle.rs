use std::sync::Arc;

use crate::{
    config::database::{Database, DatabaseTrait},
    entity::sandbox_lifecycle::SandboxLifecycle,
};

#[derive(Clone)]
pub struct SandboxLifecycleRepository {
    db_conn: Arc<Database>,
}

impl SandboxLifecycleRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    pub async fn create(
        &self,
        created_by: &str,
        created_type: &str,
    ) -> Result<SandboxLifecycle, sqlx::Error> {
        let record = sqlx::query_as!(
            SandboxLifecycle,
            r#"
            INSERT INTO sandbox_lifecycle (created_by, created_type, status)
            VALUES ($1, $2, 'active')
            RETURNING id, status, created_by, created_type, torndown_by, torndown_type,
                      unique_users, started_at, ended_at
            "#,
            created_by,
            created_type
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(record)
    }

    pub async fn get_active(&self) -> Result<Option<SandboxLifecycle>, sqlx::Error> {
        let record = sqlx::query_as!(
            SandboxLifecycle,
            r#"
            SELECT id, status, created_by, created_type, torndown_by, torndown_type,
                   unique_users,  started_at, ended_at
            FROM sandbox_lifecycle
            WHERE status = 'active'
            ORDER BY started_at DESC
            LIMIT 1
            "#
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(record)
    }

    pub async fn increment_unique_users(&self, id: i32) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            UPDATE sandbox_lifecycle
            SET unique_users = unique_users + 1
            WHERE id = $1
            "#,
            id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    pub async fn teardown(
        &self,
        id: i32,
        status: &str,
        torndown_by: &str,
        torndown_type: &str,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            UPDATE sandbox_lifecycle
            SET status = $2,
                torndown_by = $3,
                torndown_type = $4,
                ended_at = NOW()
            WHERE id = $1
            "#,
            id,
            status,
            torndown_by,
            torndown_type,
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    pub async fn get_all(&self, limit: i64) -> Result<Vec<SandboxLifecycle>, sqlx::Error> {
        let records = sqlx::query_as!(
            SandboxLifecycle,
            r#"
            SELECT id, status, created_by, created_type, torndown_by, torndown_type,
                   unique_users, started_at, ended_at
            FROM sandbox_lifecycle
            ORDER BY started_at DESC
            LIMIT $1
            "#,
            limit
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(records)
    }

    pub async fn calculate_total_session_hours(&self) -> Result<Option<f64>, sqlx::Error> {
        let result: Option<f64> = sqlx::query_scalar(
            r#"
            SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time)) / 3600)
            FROM session
            WHERE user_id LIKE 'guest_%'
              AND end_time IS NOT NULL
            "#,
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(result)
    }
    pub async fn reset_sandbox(&self) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            DO $$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
                LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
            "#
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    pub async fn get_all_guest_ids(&self) -> Result<Vec<String>, sqlx::Error> {
        let guest_ids: Vec<String> =
            sqlx::query_scalar("SELECT id FROM \"user\" WHERE id LIKE 'guest_%' ORDER BY id")
                .fetch_all(self.db_conn.get_pool())
                .await?;

        Ok(guest_ids)
    }

    pub async fn create_guest_user_pool(&self, count: usize) -> Result<i64, sqlx::Error> {
        // Find highest existing guest number
        let max_guest_num: Option<i32> = sqlx::query_scalar(
            r#"
            SELECT CAST(SUBSTRING(id FROM 7) AS INTEGER) as guest_num
            FROM "user"
            WHERE id LIKE 'guest_%'
            ORDER BY guest_num DESC
            LIMIT 1
            "#,
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        let start_num = max_guest_num.unwrap_or(0) + 1;

        let mut created_count = 0i64;

        for i in 0..count {
            let guest_num = start_num + i as i32;
            let guest_id = format!("guest_{:03}", guest_num);
            let display_name = format!("Guest #{}", guest_num);
            let email = format!("{}@sandbox.nowaster.app", guest_id);

            let result = sqlx::query!(
                r#"
                INSERT INTO "user" (id, displayname, email, role, created_at)
                VALUES ($1, $2, $3, 'user', NOW())
                "#,
                guest_id,
                display_name,
                email
            )
            .execute(self.db_conn.get_pool())
            .await?;

            if result.rows_affected() > 0 {
                created_count += 1;
            }
        }

        Ok(created_count)
    }
}
