use anyhow::{Context, Result};
use chrono::{Duration, Utc};
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::crypto::{generate_random_hex, sha256_hash};
use crate::config::database::{Database, DatabaseTrait};
use crate::router::clerk::UserRole;

#[derive(Debug)]
pub struct ApiTokenRecord {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: chrono::DateTime<Utc>,
    pub expires_at: Option<chrono::DateTime<Utc>>,
    pub last_used_at: Option<chrono::DateTime<Utc>>,
    pub revoked_at: Option<chrono::DateTime<Utc>>,
}

#[derive(Clone)]
pub struct ApiTokenRepository {
    db_conn: Arc<Database>,
}

impl ApiTokenRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    pub async fn generate_api_token(
        &self,
        user_id: &str,
        name: &str,
        description: Option<&str>,
        expires_in_days: Option<i64>,
    ) -> Result<(String, Uuid)> {
        let token = generate_random_hex(32);
        let token_hash = sha256_hash(&token);
        let expires_at = expires_in_days.map(|days| Utc::now() + Duration::days(days));

        let record = sqlx::query!(
            r#"
            INSERT INTO api_tokens (user_id, token_hash, name, description, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
            "#,
            user_id,
            token_hash,
            name,
            description,
            expires_at
        )
        .fetch_one(self.db_conn.get_pool())
        .await
        .context("Failed to store API token")?;

        Ok((token, record.id))
    }

    pub async fn validate_api_token(&self, token: &str) -> Result<(String, UserRole)> {
        let token_hash = sha256_hash(token);

        let record = sqlx::query!(
            r#"
            SELECT t.user_id, t.expires_at, t.revoked_at, u.role as "role!: UserRole"
            FROM api_tokens t
            INNER JOIN "user" u ON t.user_id = u.id
            WHERE t.token_hash = $1
            "#,
            token_hash
        )
        .fetch_optional(self.db_conn.get_pool())
        .await
        .context("Database query failed")?
        .context("Invalid API token")?;

        if let Some(expires_at) = record.expires_at {
            if expires_at < Utc::now() {
                anyhow::bail!("API token expired");
            }
        }

        if record.revoked_at.is_some() {
            anyhow::bail!("API token revoked");
        }

        sqlx::query!(
            "UPDATE api_tokens SET last_used_at = NOW() WHERE token_hash = $1",
            token_hash
        )
        .execute(self.db_conn.get_pool())
        .await
        .ok();

        Ok((record.user_id, record.role))
    }

    pub async fn list_user_tokens(&self, user_id: &str) -> Result<Vec<ApiTokenRecord>> {
        let records = sqlx::query!(
            r#"
            SELECT id, name, description, created_at, expires_at, last_used_at, revoked_at
            FROM api_tokens
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
            user_id
        )
        .fetch_all(self.db_conn.get_pool())
        .await
        .context("Failed to fetch API tokens")?;

        Ok(records
            .into_iter()
            .map(|r| ApiTokenRecord {
                id: r.id,
                name: r.name,
                description: r.description,
                created_at: r.created_at,
                expires_at: r.expires_at,
                last_used_at: r.last_used_at,
                revoked_at: r.revoked_at,
            })
            .collect())
    }

    pub async fn revoke_token_by_id(
        &self,
        token_id: Uuid,
        user_id: &str,
        reason: &str,
    ) -> Result<()> {
        let result = sqlx::query!(
            r#"
            UPDATE api_tokens
            SET revoked_at = NOW(), revoked_reason = $1
            WHERE id = $2 AND user_id = $3 AND revoked_at IS NULL
            "#,
            reason,
            token_id,
            user_id
        )
        .execute(self.db_conn.get_pool())
        .await
        .context("Failed to revoke API token")?;

        if result.rows_affected() == 0 {
            anyhow::bail!("Token not found or already revoked");
        }

        Ok(())
    }
}
