use anyhow::{Context, Result};
use serde::Deserialize;

use crate::config::env::GitHubOAuthConfig;

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

impl GitHubProvider {
    pub fn config_from(github_config: &GitHubOAuthConfig) -> OAuthConfig {
        OAuthConfig {
            client_id: github_config.client_id.clone(),
            client_secret: github_config.client_secret.clone(),
            auth_url: "https://github.com/login/oauth/authorize".to_string(),
            token_url: "https://github.com/login/oauth/access_token".to_string(),
            redirect_url: github_config.redirect_uri.clone(),
            scopes: vec!["read:user".to_string(), "user:email".to_string()],
        }
    }
}

impl OAuthProvider for GitHubProvider {
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

        println!("🔄 [GITHUB] Exchanging code for token...");
        println!("🔄 [GITHUB] Token URL: {}", config.token_url);
        println!("🔄 [GITHUB] Client ID: {}", config.client_id);
        println!("🔄 [GITHUB] Redirect URI: {}", config.redirect_url);
        println!("🔄 [GITHUB] Code: {}...", &code.chars().take(20).collect::<String>());

        let response = client
            .post(&config.token_url)
            .header("Accept", "application/json")
            .form(&params)
            .send()
            .await
            .map_err(|e| {
                println!("❌ [GITHUB] Request failed: {}", e);
                println!("❌ [GITHUB] Error details: {:?}", e);
                if e.is_connect() {
                    println!("❌ [GITHUB] Connection error - check network/firewall");
                } else if e.is_timeout() {
                    println!("❌ [GITHUB] Request timeout");
                } else if e.is_request() {
                    println!("❌ [GITHUB] Request building error");
                }
                anyhow::anyhow!("Failed to exchange code for token: {}", e)
            })?;

        println!("✅ [GITHUB] Got response with status: {}", response.status());

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            println!(
                "❌ [GITHUB] Token exchange failed - Status: {}, Response: {}, Redirect URI: {}",
                status,
                error_text,
                config.redirect_url
            );
            anyhow::bail!("Token exchange failed (status {}): {}", status, error_text);
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
