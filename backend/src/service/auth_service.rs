use anyhow::{Context, Result};
use sqlx::PgPool;
use std::net::IpAddr;
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    auth::{
        generate_access_token, generate_refresh_token, revoke_refresh_token, validate_refresh_token,
    },
    config::database::{Database, DatabaseTrait},
    repository::{
        auth::{
            api_tokens::{ApiTokenRecord, ApiTokenRepository},
            impersonation::ImpersonationRepository,
            oauth_account::{OAuthAccountRepository, OAuthAccountRepositoryTrait},
        },
        user::UserRepository,
    },
    router::clerk::UserRole,
};

use crate::auth::providers::UserProfile;

#[derive(Clone)]
pub struct AuthService {
    user_repo: UserRepository,
    oauth_repo: OAuthAccountRepository,
    api_token_repo: ApiTokenRepository,
    impersonation_repo: ImpersonationRepository,
    pool: Arc<PgPool>,
}

impl AuthService {
    pub fn new(database: &Arc<Database>) -> Self {
        Self {
            user_repo: UserRepository::new(database),
            oauth_repo: OAuthAccountRepository::new(database),
            api_token_repo: ApiTokenRepository::new(database),
            impersonation_repo: ImpersonationRepository::new(database),
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
    ) -> Result<(String, String, Uuid, bool)> {
        println!("🔐 [AUTH] Starting OAuth login for provider: {}", provider);
        println!(
            "🔐 [AUTH] Profile: email={}, provider_user_id={}",
            profile.email, profile.provider_user_id
        );

        // 1. Find existing OAuth account or user by email
        println!("🔐 [AUTH] Looking up existing OAuth account...");
        let existing_oauth = self
            .oauth_repo
            .find_by_provider_and_user_id(provider, &profile.provider_user_id)
            .await?;

        println!(
            "🔐 [AUTH] Existing OAuth account found: {}",
            existing_oauth.is_some()
        );

        let mut is_new_user = false;
        let user_id = if let Some(oauth_account) = existing_oauth {
            // User already linked via this OAuth provider
            println!(
                "🔐 [AUTH] Found existing OAuth account for user {}",
                oauth_account.user_id
            );
            oauth_account.user_id
        } else {
            println!("🔐 [AUTH] No existing OAuth account, checking user by email...");
            // Check if user exists by email (for linking multiple OAuth accounts)
            let existing_user = self.user_repo.find_by_email(&profile.email).await?;

            let user_id = if let Some(user) = existing_user {
                println!("🔐 [AUTH] Found existing user by email: {}", user.id);
                user.id
            } else {
                // Create new user
                println!("🔐 [AUTH] Creating NEW user from OAuth profile");
                is_new_user = true;
                let display_name = profile
                    .display_name
                    .or(profile.username.clone())
                    .unwrap_or_else(|| profile.email.split('@').next().unwrap().to_string());

                println!("🔐 [AUTH] Display name: {}", display_name);

                let user = self
                    .user_repo
                    .upsert_from_oauth(&profile.email, &display_name, profile.avatar_url.as_deref())
                    .await?;

                println!("🔐 [AUTH] User created with ID: {}", user.id);
                user.id
            };

            // Link OAuth account
            println!("🔐 [AUTH] Linking OAuth account to user: {}", user_id);
            self.oauth_repo
                .upsert(
                    &user_id,
                    provider,
                    &profile.provider_user_id,
                    Some(&profile.email),
                )
                .await?;

            println!("🔐 [AUTH] OAuth account linked successfully");
            user_id
        };

        // 2. Get user with role and display name for token generation
        println!("🔐 [AUTH] Fetching actor for user: {}", user_id);
        let (actor, display_name) = self
            .user_repo
            .get_actor_by_id(user_id.clone())
            .await?
            .context("User not found after creation")?;

        println!("🔐 [AUTH] Actor found with role: {:?}", actor.role);

        // Parse user_id to UUID (it's stored as string for Clerk compatibility)
        let user_uuid = Uuid::parse_str(&actor.user_id).unwrap_or_else(|_| {
            println!("🔐 [AUTH] User ID is not a UUID, generating new one");
            // If not a valid UUID (old Clerk ID), generate a new one
            // In production, you might want to handle this migration differently
            Uuid::new_v4()
        });

        println!("🔐 [AUTH] User UUID: {}", user_uuid);

        // 3. Generate access token (JWT, 15 minutes)
        println!("🔐 [AUTH] Generating access token...");
        let access_token = generate_access_token(user_uuid, actor.role, display_name)?;
        println!(
            "🔐 [AUTH] Access token generated (length: {})",
            access_token.len()
        );

        // 4. Generate refresh token (30 days)
        println!("🔐 [AUTH] Generating refresh token...");
        let refresh_token = generate_refresh_token(user_uuid, user_agent, ip, &self.pool).await?;
        println!(
            "🔐 [AUTH] Refresh token generated (length: {})",
            refresh_token.len()
        );

        println!(
            "🔐 [AUTH] ✅ OAuth login completed successfully! New user: {}",
            is_new_user
        );
        Ok((access_token, refresh_token, user_uuid, is_new_user))
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

        // 2. Get user with role and display name
        let (actor, display_name) = self
            .user_repo
            .get_actor_by_id(user_uuid.to_string())
            .await?
            .context("User not found")?;

        // 3. Generate new access token
        let access_token = generate_access_token(user_uuid, actor.role, display_name)?;

        // 4. Generate new refresh token (rotation)
        let new_refresh_token =
            generate_refresh_token(user_uuid, user_agent, ip, &self.pool).await?;

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

    #[instrument(err, skip(self))]
    pub async fn create_api_token(
        &self,
        user_id: &str,
        name: &str,
        description: Option<&str>,
        expires_in_days: Option<i64>,
    ) -> Result<(String, Uuid)> {
        self.api_token_repo
            .generate_api_token(user_id, name, description, expires_in_days)
            .await
    }

    #[instrument(err, skip(self))]
    pub async fn list_api_tokens(&self, user_id: &str) -> Result<Vec<ApiTokenRecord>> {
        self.api_token_repo.list_user_tokens(user_id).await
    }

    #[instrument(err, skip(self))]
    pub async fn revoke_api_token(
        &self,
        token_id: Uuid,
        user_id: &str,
        reason: &str,
    ) -> Result<()> {
        self.api_token_repo
            .revoke_token_by_id(token_id, user_id, reason)
            .await
    }

    #[instrument(err, skip(self, token))]
    pub async fn validate_api_token(&self, token: &str) -> Result<(String, UserRole)> {
        self.api_token_repo.validate_api_token(token).await
    }

    #[instrument(err, skip(self))]
    pub async fn start_impersonation(
        &self,
        admin_user_id: &str,
        target_user_id: &str,
    ) -> Result<String> {
        self.impersonation_repo
            .create_impersonation_session(admin_user_id, target_user_id)
            .await
    }

    #[instrument(err, skip(self, token))]
    pub async fn validate_impersonation_token(
        &self,
        token: &str,
    ) -> Result<Option<(String, String)>> {
        self.impersonation_repo
            .validate_impersonation_token(token)
            .await
    }

    #[instrument(err, skip(self, token))]
    pub async fn stop_impersonation(&self, token: &str) -> Result<()> {
        self.impersonation_repo
            .revoke_impersonation_token(token)
            .await
    }
}
