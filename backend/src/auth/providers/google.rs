use anyhow::{Context, Result};
use serde::Deserialize;
use std::env;

use super::{OAuthConfig, OAuthProvider, UserProfile};

pub struct GoogleProvider;

#[derive(Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct GoogleUserInfo {
    sub: String,           // Google's user ID
    email: String,
    name: Option<String>,
    picture: Option<String>,
}

impl OAuthProvider for GoogleProvider {
    fn get_config() -> Result<OAuthConfig> {
        let client_id = env::var("GOOGLE_CLIENT_ID")
            .context("GOOGLE_CLIENT_ID not set")?;
        let client_secret = env::var("GOOGLE_CLIENT_SECRET")
            .context("GOOGLE_CLIENT_SECRET not set")?;
        let base_url = env::var("BASE_URL")
            .unwrap_or_else(|_| "http://localhost:4008".to_string());

        Ok(OAuthConfig {
            client_id,
            client_secret,
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth".to_string(),
            token_url: "https://oauth2.googleapis.com/token".to_string(),
            redirect_url: format!("{}/api/auth/callback/google", base_url),
            scopes: vec![
                "openid".to_string(),
                "profile".to_string(),
                "email".to_string(),
            ],
        })
    }

    fn build_authorization_url(config: &OAuthConfig, state: &str) -> String {
        let scope = config.scopes.join(" ");
        format!(
            "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}&access_type=offline",
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
            .form(&params)
            .send()
            .await
            .context("Failed to exchange code for token")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Token exchange failed: {}", error_text);
        }

        let token_response: GoogleTokenResponse = response
            .json()
            .await
            .context("Failed to parse token response")?;

        Ok(token_response.access_token)
    }

    async fn fetch_user_profile(access_token: &str) -> Result<UserProfile> {
        let client = reqwest::Client::new();

        let response = client
            .get("https://www.googleapis.com/oauth2/v2/userinfo")
            .bearer_auth(access_token)
            .send()
            .await
            .context("Failed to fetch user profile")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Failed to fetch user profile: {}", error_text);
        }

        let user_info: GoogleUserInfo = response
            .json()
            .await
            .context("Failed to parse user info")?;

        Ok(UserProfile {
            provider_user_id: user_info.sub,
            email: user_info.email.clone(),
            username: user_info.email.split('@').next().map(|s| s.to_string()),
            display_name: user_info.name,
            avatar_url: user_info.picture,
        })
    }
}
