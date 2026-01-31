use std::sync::Arc;

use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    entity::sandbox_lifecycle::{SandboxLifecycle, SandboxStatus},
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
        let status: String = SandboxStatus::Bare.into();
        let record = sqlx::query_as!(
            SandboxLifecycle,
            r#"
            INSERT INTO sandbox_lifecycle (created_by, created_type, status)
            VALUES ($1, $2, $3)
            RETURNING id, status, created_by, created_type, torndown_by, torndown_type,
                      unique_users, started_at, ended_at
            "#,
            created_by,
            created_type,
            status
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(record)
    }

    pub async fn get_active(&self) -> Result<Option<SandboxLifecycle>, sqlx::Error> {
        let status: String = SandboxStatus::Active.into();
        let record = sqlx::query_as!(
            SandboxLifecycle,
            r#"
            SELECT id, status, created_by, created_type, torndown_by, torndown_type,
                   unique_users,  started_at, ended_at
            FROM sandbox_lifecycle
            WHERE status = $1
            ORDER BY started_at DESC
            LIMIT 1
            "#,
            status
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(record)
    }

    pub async fn increment_unique_users(&self, id: Uuid) -> Result<(), sqlx::Error> {
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
        id: Uuid,
        torndown_by: &str,
        torndown_type: &str,
    ) -> Result<SandboxLifecycle, sqlx::Error> {
        let result = sqlx::query_as!(
            SandboxLifecycle,
            r#"
            UPDATE sandbox_lifecycle
            SET torndown_by = $2,
                torndown_type = $3,
                status = 'recycled',
                ended_at = NOW()
            WHERE id = $1
            RETURNING id, status, created_by, created_type, torndown_by, torndown_type,
                   unique_users,  started_at, ended_at
            "#,
            id,
            torndown_by,
            torndown_type,
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(result)
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
                FOR r IN (
                    SELECT tablename
                    FROM pg_tables
                    WHERE schemaname = 'public'
                    AND tablename != '_sqlx_migrations'
                )
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

    pub async fn get_guest_pool_entries(&self) -> Result<Vec<(String, String)>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"SELECT id, displayname FROM "user" WHERE id LIKE 'guest_%'"#
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows.into_iter().map(|r| (r.id, r.displayname)).collect())
    }

    pub async fn upsert_lifecycle(
        &self,
        id: Uuid,
        status: &str,
        created_by: &str,
        created_type: &str,
        torndown_by: Option<&str>,
        torndown_type: Option<&str>,
        unique_users: i32,
        started_at: chrono::DateTime<chrono::Utc>,
        ended_at: Option<chrono::DateTime<chrono::Utc>>,
    ) -> Result<(), sqlx::Error> {
        sqlx::query!(
            r#"
            INSERT INTO sandbox_lifecycle
                (id, status, created_by, created_type, torndown_by, torndown_type,
                 unique_users, started_at, ended_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
                status       = EXCLUDED.status,
                torndown_by  = EXCLUDED.torndown_by,
                torndown_type = EXCLUDED.torndown_type,
                unique_users = EXCLUDED.unique_users,
                ended_at     = EXCLUDED.ended_at
            "#,
            id,
            status,
            created_by,
            created_type,
            torndown_by,
            torndown_type,
            unique_users,
            started_at,
            ended_at,
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    pub async fn create_guest_user_pool(&self, count: usize) -> Result<i64, sqlx::Error> {
        let current_count: i64 = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM "user" WHERE id LIKE 'guest_%'"#,
        )
        .fetch_one(self.db_conn.get_pool())
        .await?
        .unwrap_or(0);

        let mut created_count = 0i64;

        for i in 0..count {
            let guest_id = format!("guest_{}", Uuid::new_v4().simple());
            let display_num = current_count + i as i64 + 1;
            let display_name = format!("Guest #{}", display_num);
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
