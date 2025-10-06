pub mod google;
pub mod github;
pub mod discord;

use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct OAuthConfig {
    pub client_id: String,
    pub client_secret: String,
    pub auth_url: String,
    pub token_url: String,
    pub redirect_url: String,
    pub scopes: Vec<String>,
}

/// User profile information from OAuth provider
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub provider_user_id: String,
    pub email: String,
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
}

pub trait OAuthProvider {
    fn build_authorization_url(config: &OAuthConfig, state: &str) -> String;

    async fn exchange_code(config: &OAuthConfig, code: &str) -> Result<String>;

    async fn fetch_user_profile(access_token: &str) -> Result<UserProfile>;
}
