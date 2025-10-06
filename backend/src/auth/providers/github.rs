use anyhow::{Context, Result};
use serde::Deserialize;
use std::env;

use super::{OAuthConfig, OAuthProvider, UserProfile};

pub struct GitHubProvider;

#[derive(Deserialize)]
struct GitHubTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct GitHubUserInfo {
    id: i64,
    login: String,
    email: Option<String>,
    name: Option<String>,
    avatar_url: Option<String>,
}

#[derive(Deserialize)]
struct GitHubEmail {
    email: String,
    primary: bool,
    verified: bool,
}

impl OAuthProvider for GitHubProvider {
    fn get_config() -> Result<OAuthConfig> {
        let client_id = env::var("GITHUB_CLIENT_ID")
            .context("GITHUB_CLIENT_ID not set")?;
        let client_secret = env::var("GITHUB_CLIENT_SECRET")
            .context("GITHUB_CLIENT_SECRET not set")?;
        let base_url = env::var("BASE_URL")
            .unwrap_or_else(|_| "http://localhost:4008".to_string());

        Ok(OAuthConfig {
            client_id,
            client_secret,
            auth_url: "https://github.com/login/oauth/authorize".to_string(),
            token_url: "https://github.com/login/oauth/access_token".to_string(),
            redirect_url: format!("{}/api/auth/callback/github", base_url),
            scopes: vec![
                "read:user".to_string(),
                "user:email".to_string(),
            ],
        })
    }

    fn build_authorization_url(config: &OAuthConfig, state: &str) -> String {
        let scope = config.scopes.join(" ");
        format!(
            "{}?client_id={}&redirect_uri={}&scope={}&state={}",
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
            ("redirect_uri", config.redirect_url.as_str()),
        ];

        let response = client
            .post(&config.token_url)
            .header("Accept", "application/json")
            .form(&params)
            .send()
            .await
            .context("Failed to exchange code for token")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            anyhow::bail!("Token exchange failed: {}", error_text);
        }

        let token_response: GitHubTokenResponse = response
            .json()
            .await
            .context("Failed to parse token response")?;

        Ok(token_response.access_token)
    }

    async fn fetch_user_profile(access_token: &str) -> Result<UserProfile> {
        let client = reqwest::Client::new();

        // Fetch user info
        let user_response = client
            .get("https://api.github.com/user")
            .header("Accept", "application/json")
            .header("User-Agent", "Nowaster-Auth")
            .bearer_auth(access_token)
            .send()
            .await
            .context("Failed to fetch user profile")?;

        if !user_response.status().is_success() {
            let error_text = user_response.text().await.unwrap_or_default();
            anyhow::bail!("Failed to fetch user profile: {}", error_text);
        }

        let user_info: GitHubUserInfo = user_response
            .json()
            .await
            .context("Failed to parse user info")?;

        // Fetch email if not public
        let email = if let Some(email) = user_info.email {
            email
        } else {
            // Fetch from emails endpoint
            let emails_response = client
                .get("https://api.github.com/user/emails")
                .header("Accept", "application/json")
                .header("User-Agent", "Nowaster-Auth")
                .bearer_auth(access_token)
                .send()
                .await
                .context("Failed to fetch user emails")?;

            let emails: Vec<GitHubEmail> = emails_response
                .json()
                .await
                .context("Failed to parse emails")?;

            // Get primary verified email
            emails
                .iter()
                .find(|e| e.primary && e.verified)
                .or_else(|| emails.first())
                .map(|e| e.email.clone())
                .context("No email found for GitHub user")?
        };

        Ok(UserProfile {
            provider_user_id: user_info.id.to_string(),
            email,
            username: Some(user_info.login),
            display_name: user_info.name,
            avatar_url: user_info.avatar_url,
        })
    }
}
