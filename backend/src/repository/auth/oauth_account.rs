use anyhow::Result;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::config::database::{Database, DatabaseTrait};

#[derive(Clone)]
pub struct OAuthAccountRepository {
    db_conn: Arc<Database>,
}

#[derive(Debug, FromRow)]
pub struct OAuthAccount {
    pub id: Uuid,
    pub user_id: String,
    pub provider: String,
    pub provider_user_id: String,
    pub provider_email: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub trait OAuthAccountRepositoryTrait {
    fn new(db_conn: &Arc<Database>) -> Self;

    async fn upsert(
        &self,
        user_id: &str,
        provider: &str,
        provider_user_id: &str,
        provider_email: Option<&str>,
    ) -> Result<OAuthAccount>;

    async fn find_by_provider_and_user_id(
        &self,
        provider: &str,
        provider_user_id: &str,
    ) -> Result<Option<OAuthAccount>>;

    async fn find_by_user_id(&self, user_id: &str) -> Result<Vec<OAuthAccount>>;

    async fn find_by_provider_email(
        &self,
        provider: &str,
        email: &str,
    ) -> Result<Option<OAuthAccount>>;
}

impl OAuthAccountRepositoryTrait for OAuthAccountRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    async fn upsert(
        &self,
        user_id: &str,
        provider: &str,
        provider_user_id: &str,
        provider_email: Option<&str>,
    ) -> Result<OAuthAccount> {
        let record = sqlx::query_as!(
            OAuthAccount,
            r#"
            INSERT INTO oauth_accounts (user_id, provider, provider_user_id, provider_email)
            VALUES ($1, $2::oauth_provider, $3, $4)
            ON CONFLICT (provider, provider_user_id)
            DO UPDATE SET
                user_id = EXCLUDED.user_id,
                provider_email = EXCLUDED.provider_email,
                updated_at = NOW()
            RETURNING
                id,
                user_id,
                provider as "provider!: String",
                provider_user_id,
                provider_email,
                created_at,
                updated_at
            "#,
            user_id,
            provider as _,
            provider_user_id,
            provider_email
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(record)
    }

    #[instrument(err, skip(self))]
    async fn find_by_provider_and_user_id(
        &self,
        provider: &str,
        provider_user_id: &str,
    ) -> Result<Option<OAuthAccount>> {
        let record = sqlx::query_as!(
            OAuthAccount,
            r#"
            SELECT
                id,
                user_id,
                provider as "provider!: String",
                provider_user_id,
                provider_email,
                created_at,
                updated_at
            FROM oauth_accounts
            WHERE provider = $1::oauth_provider AND provider_user_id = $2
            "#,
            provider as _,
            provider_user_id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(record)
    }

    #[instrument(err, skip(self))]
    async fn find_by_user_id(&self, user_id: &str) -> Result<Vec<OAuthAccount>> {
        let records = sqlx::query_as!(
            OAuthAccount,
            r#"
            SELECT
                id,
                user_id,
                provider as "provider!: String",
                provider_user_id,
                provider_email,
                created_at,
                updated_at
            FROM oauth_accounts
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
            user_id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(records)
    }

    #[instrument(err, skip(self))]
    async fn find_by_provider_email(
        &self,
        provider: &str,
        email: &str,
    ) -> Result<Option<OAuthAccount>> {
        let record = sqlx::query_as!(
            OAuthAccount,
            r#"
            SELECT
                id,
                user_id,
                provider as "provider!: String",
                provider_user_id,
                provider_email,
                created_at,
                updated_at
            FROM oauth_accounts
            WHERE provider = $1::oauth_provider AND provider_email = $2
            "#,
            provider as _,
            email
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(record)
    }
}
