use anyhow::{Context, Result};
use serde::Deserialize;

use crate::config::env::DiscordOAuthConfig;

use super::{OAuthConfig, OAuthProvider, UserProfile};

pub struct DiscordProvider;

#[derive(Deserialize)]
struct DiscordTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct DiscordUserInfo {
    id: String,
    username: String,
    email: Option<String>,
    global_name: Option<String>,
    avatar: Option<String>,
}

impl DiscordProvider {
    /// Create OAuthConfig from typed config
    pub fn config_from(discord_config: &DiscordOAuthConfig) -> OAuthConfig {
        OAuthConfig {
            client_id: discord_config.client_id.clone(),
            client_secret: discord_config.client_secret.clone(),
            auth_url: "https://discord.com/api/oauth2/authorize".to_string(),
            token_url: "https://discord.com/api/oauth2/token".to_string(),
            redirect_url: discord_config.redirect_uri.clone(),
            scopes: vec!["identify".to_string(), "email".to_string()],
        }
    }
}

impl OAuthProvider for DiscordProvider {
    fn build_authorization_url(config: &OAuthConfig, state: &str) -> String {
        let scope = config.scopes.join(" ");
        format!(
            "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
            config.auth_url,
            urlencoding::encode(&config.client_id),
            urlencoding::encode(&config.redirect_url),
            urlencoding::encode(&scope),
            urlencoding::encode(state)
        )
    }

    async fn exchange_code(config: &OAuthConfig, code: &str) -> Result<String> {
        let client = reqwest::Client::new();

        let params = [
            ("client_id", config.client_id.as_str()),
            ("client_secret", config.client_secret.as_str()),
            ("code", code),
            ("grant_type", "authorization_code"),
            ("redirect_uri", config.redirect_url.as_str()),
        ];

        let response = client
            .post(&config.token_url)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .form(&params)
            .send()
            .await
            .context("Failed to exchange code for token")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Token exchange failed: {}", error_text);
        }

        let token_response: DiscordTokenResponse = response
            .json()
            .await
            .context("Failed to parse token response")?;

        Ok(token_response.access_token)
    }

    async fn fetch_user_profile(access_token: &str) -> Result<UserProfile> {
        let client = reqwest::Client::new();

        let response = client
            .get("https://discord.com/api/users/@me")
            .bearer_auth(access_token)
            .send()
            .await
            .context("Failed to fetch user profile")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Failed to fetch user profile: {}", error_text);
        }

        let user_info: DiscordUserInfo =
            response.json().await.context("Failed to parse user info")?;

        let email = user_info
            .email
            .context("Discord user has no email (email scope may not be granted)")?;

        // Build avatar URL if available
        let avatar_url = user_info.avatar.map(|avatar_hash| {
            format!(
                "https://cdn.discordapp.com/avatars/{}/{}.png",
                user_info.id, avatar_hash
            )
        });

        Ok(UserProfile {
            provider_user_id: user_info.id,
            email,
            username: Some(user_info.username.clone()),
            display_name: user_info.global_name.or(Some(user_info.username)),
            avatar_url,
        })
    }
}
