use anyhow::Result;
use chrono::{Duration, Utc};
use std::sync::Arc;

use crate::{
    auth::crypto::{generate_random_hex, sha256_hash},
    config::database::{Database, DatabaseTrait},
};

#[derive(Clone)]
pub struct ImpersonationRepository {
    db_conn: Arc<Database>,
}

impl ImpersonationRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    pub async fn create_impersonation_session(
        &self,
        admin_user_id: &str,
        target_user_id: &str,
    ) -> Result<String> {
        let token = generate_random_hex(32);
        let token_hash = sha256_hash(&token);
        let expires_at = Utc::now() + Duration::hours(1);

        sqlx::query!(
            r#"
            INSERT INTO impersonation_sessions (admin_user_id, target_user_id, token_hash, expires_at)
            VALUES ($1, $2, $3, $4)
            "#,
            admin_user_id,
            target_user_id,
            token_hash,
            expires_at
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(token)
    }

    pub async fn validate_impersonation_token(
        &self,
        token: &str,
    ) -> Result<Option<(String, String)>> {
        let token_hash = sha256_hash(token);

        let record = sqlx::query!(
            r#"
            SELECT admin_user_id, target_user_id, expires_at
            FROM impersonation_sessions
            WHERE token_hash = $1
            "#,
            token_hash
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        if let Some(record) = record {
            if record.expires_at > Utc::now() {
                return Ok(Some((record.target_user_id, record.admin_user_id)));
            }
        }

        Ok(None)
    }

    pub async fn revoke_impersonation_token(&self, token: &str) -> Result<()> {
        let token_hash = sha256_hash(token);

        sqlx::query!(
            r#"
            DELETE FROM impersonation_sessions
            WHERE token_hash = $1
            "#,
            token_hash
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }
}
