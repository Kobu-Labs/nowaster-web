use anyhow::{Context, Result};
use serde::Deserialize;

use crate::config::env::GoogleOAuthConfig;

use super::{OAuthConfig, OAuthProvider, UserProfile};

pub struct GoogleProvider;

#[derive(Deserialize)]
struct GoogleTokenResponse {
    access_token: String,
}

#[derive(Deserialize)]
struct GoogleUserInfo {
    id: String,
    email: Option<String>,
    name: Option<String>,
    picture: Option<String>,
    #[serde(default)]
    verified_email: bool,
}

impl GoogleProvider {
    pub fn config_from(google_config: &GoogleOAuthConfig) -> OAuthConfig {
        OAuthConfig {
            client_id: google_config.client_id.clone(),
            client_secret: google_config.client_secret.clone(),
            auth_url: "https://accounts.google.com/o/oauth2/v2/auth".to_string(),
            token_url: "https://oauth2.googleapis.com/token".to_string(),
            redirect_url: google_config.redirect_uri.clone(),
            scopes: vec![
                "openid".to_string(),
                "profile".to_string(),
                "email".to_string(),
            ],
        }
    }
}

impl OAuthProvider for GoogleProvider {
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

        println!("🔄 [GOOGLE] Exchanging code for token...");
        println!("🔄 [GOOGLE] Token URL: {}", config.token_url);
        println!("🔄 [GOOGLE] Client ID: {}", config.client_id);
        println!("🔄 [GOOGLE] Redirect URI: {}", config.redirect_url);
        println!("🔄 [GOOGLE] Code: {}...", &code.chars().take(20).collect::<String>());

        let response = client
            .post(&config.token_url)
            .form(&params)
            .send()
            .await
            .map_err(|e| {
                println!("❌ [GOOGLE] Request failed: {}", e);
                println!("❌ [GOOGLE] Error details: {:?}", e);
                if e.is_connect() {
                    println!("❌ [GOOGLE] Connection error - check network/firewall");
                } else if e.is_timeout() {
                    println!("❌ [GOOGLE] Request timeout");
                } else if e.is_request() {
                    println!("❌ [GOOGLE] Request building error");
                }
                anyhow::anyhow!("Failed to exchange code for token: {}", e)
            })?;

        println!("✅ [GOOGLE] Got response with status: {}", response.status());

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            println!(
                "❌ [GOOGLE] Token exchange failed - Status: {}, Response: {}, Redirect URI: {}",
                status,
                error_text,
                config.redirect_url
            );
            anyhow::bail!("Token exchange failed (status {}): {}", status, error_text);
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

        // Debug: Print raw response
        let response_text = response.text().await.context("Failed to read response")?;
        println!("📥 [GOOGLE] Raw user info response: {}", response_text);

        let user_info: GoogleUserInfo =
            serde_json::from_str(&response_text).context("Failed to parse user info")?;

        println!(
            "📥 [GOOGLE] Parsed user info: id={}, email={:?}, name={:?}",
            user_info.id, user_info.email, user_info.name
        );

        // Validate email is present
        let email = user_info
            .email
            .context("Google user has no email (email scope may not be granted)")?;

        Ok(UserProfile {
            provider_user_id: user_info.id,
            email: email.clone(),
            username: email.split('@').next().map(|s| s.to_string()),
            display_name: user_info.name,
            avatar_url: user_info.picture,
        })
    }
}
