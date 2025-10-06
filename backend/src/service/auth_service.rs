use anyhow::{Context, Result};
use sqlx::PgPool;
use std::net::IpAddr;
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    auth::{
        generate_access_token, generate_refresh_token, validate_refresh_token, revoke_refresh_token,
    },
    config::database::Database,
    repository::{
        oauth_account::{OAuthAccountRepository, OAuthAccountRepositoryTrait},
        user::UserRepository,
    },
    router::clerk::UserRole,
};

use crate::auth::providers::UserProfile;

#[derive(Clone)]
pub struct AuthService {
    user_repo: UserRepository,
    oauth_repo: OAuthAccountRepository,
    pool: Arc<PgPool>,
}

impl AuthService {
    pub fn new(database: &Arc<Database>) -> Self {
        Self {
            user_repo: UserRepository::new(database),
            oauth_repo: OAuthAccountRepository::new(database),
            pool: Arc::new(database.get_pool().clone()),
        }
    }

    /// Handle complete OAuth login flow
    /// 1. Find or create user from OAuth profile
    /// 2. Link OAuth account
    /// 3. Generate JWT access token
    /// 4. Generate refresh token
    ///
    /// Returns (access_token, refresh_token)
    #[instrument(err, skip(self, profile))]
    pub async fn handle_oauth_login(
        &self,
        provider: &str,
        profile: UserProfile,
        user_agent: Option<&str>,
        ip: Option<IpAddr>,
    ) -> Result<(String, String, Uuid)> {
        // 1. Find existing OAuth account or user by email
        let existing_oauth = self
            .oauth_repo
            .find_by_provider_and_user_id(provider, &profile.provider_user_id)
            .await?;

        let user_id = if let Some(oauth_account) = existing_oauth {
            // User already linked via this OAuth provider
            tracing::debug!("Found existing OAuth account for user {}", oauth_account.user_id);
            oauth_account.user_id
        } else {
            // Check if user exists by email (for linking multiple OAuth accounts)
            let existing_user = self.user_repo.find_by_email(&profile.email).await?;

            let user_id = if let Some(user) = existing_user {
                tracing::debug!("Found existing user by email: {}", user.id);
                user.id
            } else {
                // Create new user
                tracing::debug!("Creating new user from OAuth profile");
                let display_name = profile
                    .display_name
                    .or(profile.username.clone())
                    .unwrap_or_else(|| profile.email.split('@').next().unwrap().to_string());

                let user = self
                    .user_repo
                    .upsert_from_oauth(&profile.email, &display_name, profile.avatar_url.as_deref())
                    .await?;

                user.id
            };

            // Link OAuth account
            self.oauth_repo
                .upsert(
                    &user_id,
                    provider,
                    &profile.provider_user_id,
                    Some(&profile.email),
                )
                .await?;

            user_id
        };

        // 2. Get user with role for token generation
        let actor = self
            .user_repo
            .get_actor_by_id(user_id.clone())
            .await?
            .context("User not found after creation")?;

        // Parse user_id to UUID (it's stored as string for Clerk compatibility)
        let user_uuid = Uuid::parse_str(&actor.user_id)
            .unwrap_or_else(|_| {
                // If not a valid UUID (old Clerk ID), generate a new one
                // In production, you might want to handle this migration differently
                Uuid::new_v4()
            });

        // 3. Generate access token (JWT, 15 minutes)
        let access_token = generate_access_token(user_uuid, actor.role)?;

        // 4. Generate refresh token (30 days)
        let refresh_token = generate_refresh_token(user_uuid, user_agent, ip, &self.pool).await?;

        Ok((access_token, refresh_token, user_uuid))
    }

    /// Refresh access token using refresh token
    ///
    /// Returns (new_access_token, new_refresh_token)
    #[instrument(err, skip(self, refresh_token))]
    pub async fn refresh_access_token(
        &self,
        refresh_token: &str,
        user_agent: Option<&str>,
        ip: Option<IpAddr>,
    ) -> Result<(String, String, Uuid)> {
        // 1. Validate refresh token and get user_id
        let user_uuid = validate_refresh_token(refresh_token, &self.pool).await?;

        // 2. Get user with role
        let actor = self
            .user_repo
            .get_actor_by_id(user_uuid.to_string())
            .await?
            .context("User not found")?;

        // 3. Generate new access token
        let access_token = generate_access_token(user_uuid, actor.role)?;

        // 4. Generate new refresh token (rotation)
        let new_refresh_token = generate_refresh_token(user_uuid, user_agent, ip, &self.pool).await?;

        // 5. Revoke old refresh token
        revoke_refresh_token(refresh_token, "rotated", &self.pool).await?;

        Ok((access_token, new_refresh_token, user_uuid))
    }

    /// Logout user by revoking refresh token
    #[instrument(err, skip(self, refresh_token))]
    pub async fn logout(&self, refresh_token: &str) -> Result<()> {
        revoke_refresh_token(refresh_token, "user_logout", &self.pool).await
    }

    /// Get user ID from refresh token (without rotation)
    #[instrument(err, skip(self, refresh_token))]
    pub async fn get_user_from_refresh_token(&self, refresh_token: &str) -> Result<Uuid> {
        validate_refresh_token(refresh_token, &self.pool).await
    }
}
