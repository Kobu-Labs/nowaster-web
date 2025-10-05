use anyhow::{Context, Result};
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs;
use uuid::Uuid;

use crate::router::clerk::UserRole;

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,        // Subject (user_id as UUID string)
    pub role: String,       // User role ("user" or "admin")
    pub iat: i64,           // Issued at timestamp
    pub exp: i64,           // Expiration timestamp
    pub iss: String,        // Issuer ("nowaster-api")
    pub aud: String,        // Audience ("nowaster-web")
}

// Load RSA keys on application startup
static ENCODING_KEY: Lazy<EncodingKey> = Lazy::new(|| {
    let key_path = std::env::var("JWT_PRIVATE_KEY_PATH").unwrap_or_else(|_| "keys/private.pem".to_string());
    let private_key = fs::read(&key_path)
        .unwrap_or_else(|e| panic!("Failed to read private key from {}: {}", key_path, e));
    EncodingKey::from_rsa_pem(&private_key)
        .unwrap_or_else(|e| panic!("Invalid private key format: {}", e))
});

static DECODING_KEY: Lazy<DecodingKey> = Lazy::new(|| {
    let key_path = std::env::var("JWT_PUBLIC_KEY_PATH").unwrap_or_else(|_| "keys/public.pem".to_string());
    let public_key = fs::read(&key_path)
        .unwrap_or_else(|e| panic!("Failed to read public key from {}: {}", key_path, e));
    DecodingKey::from_rsa_pem(&public_key)
        .unwrap_or_else(|e| panic!("Invalid public key format: {}", e))
});

/// Generate a JWT access token
///
/// # Arguments
/// * `user_id` - User's UUID
/// * `role` - User's role
///
/// # Returns
/// JWT token string valid for 15 minutes
pub fn generate_access_token(user_id: Uuid, role: UserRole) -> Result<String> {
    let now = Utc::now().timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        role: role.to_string(),
        iat: now,
        exp: now + 900, // 15 minutes
        iss: "nowaster-api".to_string(),
        aud: "nowaster-web".to_string(),
    };

    let header = Header::new(Algorithm::RS256);
    encode(&header, &claims, &ENCODING_KEY)
        .context("Failed to generate access token")
}

/// Validate and decode a JWT access token
///
/// # Arguments
/// * `token` - JWT token string
///
/// # Returns
/// Decoded Claims if token is valid
pub fn validate_access_token(token: &str) -> Result<Claims> {
    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_issuer(&["nowaster-api"]);
    validation.set_audience(&["nowaster-web"]);

    let token_data = decode::<Claims>(token, &DECODING_KEY, &validation)
        .context("Invalid or expired token")?;

    Ok(token_data.claims)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_and_validate_token() {
        let user_id = Uuid::new_v4();
        let role = UserRole::User;

        let token = generate_access_token(user_id, role).expect("Failed to generate token");
        assert!(!token.is_empty());

        let claims = validate_access_token(&token).expect("Failed to validate token");
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.role, "user");
        assert_eq!(claims.iss, "nowaster-api");
        assert_eq!(claims.aud, "nowaster-web");
    }

    #[test]
    fn test_validate_invalid_token() {
        let result = validate_access_token("invalid.token.here");
        assert!(result.is_err());
    }

    #[test]
    fn test_admin_role_token() {
        let user_id = Uuid::new_v4();
        let role = UserRole::Admin;

        let token = generate_access_token(user_id, role).expect("Failed to generate token");
        let claims = validate_access_token(&token).expect("Failed to validate token");

        assert_eq!(claims.role, "admin");
    }
}
