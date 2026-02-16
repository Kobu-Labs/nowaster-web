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
        sqlx::query_as!(
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
        .await
    }

    pub async fn get_active(&self) -> Result<Option<SandboxLifecycle>, sqlx::Error> {
        sqlx::query_as!(
            SandboxLifecycle,
            r#"
            SELECT id, status, created_by, created_type, torndown_by, torndown_type,
                   unique_users, started_at, ended_at
            FROM sandbox_lifecycle
            WHERE status IN ('bare', 'active')
            ORDER BY started_at DESC
            LIMIT 1
            "#,
        )
        .fetch_optional(self.db_conn.get_pool())
        .await
    }

    pub async fn activate(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE sandbox_lifecycle SET status = 'active' WHERE id = $1",
            id,
        )
        .execute(self.db_conn.get_pool())
        .await?;
        Ok(())
    }

    pub async fn mark_failed(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE sandbox_lifecycle SET status = 'failed' WHERE id = $1",
            id,
        )
        .execute(self.db_conn.get_pool())
        .await?;
        Ok(())
    }

    pub async fn teardown_and_reset(
        &self,
        current_id: Option<Uuid>,
        torndown_by: &str,
        torndown_type: &str,
    ) -> Result<(), sqlx::Error> {
        let mut tx = self.db_conn.get_pool().begin().await?;

        if let Some(id) = current_id {
            sqlx::query!(
                r#"
                UPDATE sandbox_lifecycle
                SET torndown_by = $2,
                    torndown_type = $3,
                    status = 'recycled',
                    ended_at = NOW()
                WHERE id = $1
                "#,
                id,
                torndown_by,
                torndown_type,
            )
            .execute(&mut *tx)
            .await?;
        }

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
                    AND tablename != 'sandbox_lifecycle'
                )
                LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
                END LOOP;
            END $$;
            "#
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }

    pub async fn increment_unique_users(&self, id: Uuid) -> Result<(), sqlx::Error> {
        sqlx::query!(
            "UPDATE sandbox_lifecycle SET unique_users = unique_users + 1 WHERE id = $1",
            id
        )
        .execute(self.db_conn.get_pool())
        .await?;
        Ok(())
    }

    pub async fn get_all(&self, limit: i64) -> Result<Vec<SandboxLifecycle>, sqlx::Error> {
        sqlx::query_as!(
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
        .await
    }

    pub async fn create_guest_user_pool(&self, count: usize) -> Result<Vec<(String, String)>, sqlx::Error> {
        let current_count: i64 = sqlx::query_scalar!(
            r#"SELECT COUNT(*) FROM "user" WHERE id LIKE 'guest_%'"#,
        )
        .fetch_one(self.db_conn.get_pool())
        .await?
        .unwrap_or(0);

        let mut created: Vec<(String, String)> = Vec::new();

        for i in 0..count {
            let guest_id = format!("guest_{}", Uuid::new_v4().simple());
            let display_name = format!("Guest #{}", current_count + i as i64 + 1);
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
                created.push((guest_id, display_name));
            }
        }

        Ok(created)
    }

    pub async fn get_npc_ids(&self) -> Result<Vec<String>, sqlx::Error> {
        sqlx::query_scalar::<_, String>(r#"SELECT id FROM "user" WHERE id LIKE 'npc_%'"#)
            .fetch_all(self.db_conn.get_pool())
            .await
    }
}
