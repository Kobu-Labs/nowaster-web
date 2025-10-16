use anyhow::{Context, Result};
use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
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
// Keys must be provided via environment variables (loaded from .env.keys file):
// - JWT_PRIVATE_KEY: RSA private key in PEM format
// - JWT_PUBLIC_KEY: RSA public key in PEM format
//
// Note: These are in a separate .env.keys file because the envy crate
// (used for typed config) doesn't support multiline environment variables.
static ENCODING_KEY: Lazy<EncodingKey> = Lazy::new(|| {
    let private_key = std::env::var("JWT_PRIVATE_KEY")
        .expect("JWT_PRIVATE_KEY environment variable must be set in .env.keys file")
        .into_bytes();

    EncodingKey::from_rsa_pem(&private_key)
        .unwrap_or_else(|e| panic!("Invalid private key format: {}", e))
});

static DECODING_KEY: Lazy<DecodingKey> = Lazy::new(|| {
    let public_key = std::env::var("JWT_PUBLIC_KEY")
        .expect("JWT_PUBLIC_KEY environment variable must be set in .env.keys file")
        .into_bytes();

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
