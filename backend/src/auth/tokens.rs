use anyhow::{Context, Result};
use chrono::{Duration, Utc};
use sqlx::PgPool;
use std::net::IpAddr;
use uuid::Uuid;

use super::crypto::{generate_random_hex, sha256_hash};

/// Generate a refresh token and store it in the database
///
/// # Arguments
/// * `user_id` - User's UUID
/// * `user_agent` - User agent string from request
/// * `ip` - IP address from request
/// * `pool` - Database connection pool
///
/// # Returns
/// Plaintext refresh token (only time it's returned)
pub async fn generate_refresh_token(
    user_id: Uuid,
    user_agent: Option<&str>,
    ip: Option<IpAddr>,
    pool: &PgPool,
) -> Result<String> {
    // Generate cryptographically random token (32 bytes = 64 hex chars)
    let token = generate_random_hex(32);

    // Hash for database storage
    let token_hash = sha256_hash(&token);

    // Calculate expiry (30 days from now)
    let expires_at = Utc::now() + Duration::days(30);

    // Store in database
    sqlx::query!(
        r#"
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
        VALUES ($1, $2, $3, $4, $5)
        "#,
        user_id.to_string(),
        token_hash,
        expires_at.naive_utc(),
        user_agent,
        ip
    )
    .execute(pool)
    .await
    .context("Failed to store refresh token")?;

    // Return plaintext token (only time we have access to it)
    Ok(token)
}

/// Validate a refresh token and return the associated user_id
///
/// # Arguments
/// * `token` - Plaintext refresh token
/// * `pool` - Database connection pool
///
/// # Returns
/// User ID if token is valid and not expired/revoked
pub async fn validate_refresh_token(token: &str, pool: &PgPool) -> Result<Uuid> {
    // Hash the incoming token
    let token_hash = sha256_hash(token);

    // Query database
    let record = sqlx::query!(
        r#"
        SELECT user_id, expires_at, revoked_at
        FROM refresh_tokens
        WHERE token_hash = $1
        "#,
        token_hash
    )
    .fetch_optional(pool)
    .await
    .context("Database query failed")?
    .context("Invalid refresh token")?;

    // Check expiration
    let now = Utc::now().naive_utc();
    if record.expires_at < now {
        anyhow::bail!("Refresh token expired");
    }

    // Check revocation
    if record.revoked_at.is_some() {
        anyhow::bail!("Refresh token revoked");
    }

    // Update last_used_at
    sqlx::query!(
        "UPDATE refresh_tokens SET last_used_at = NOW() WHERE token_hash = $1",
        token_hash
    )
    .execute(pool)
    .await
    .ok(); // Ignore error - not critical

    // Return user_id
    Uuid::parse_str(&record.user_id).context("Invalid user_id format")
}

/// Revoke a refresh token
///
/// # Arguments
/// * `token` - Plaintext refresh token
/// * `reason` - Reason for revocation
/// * `pool` - Database connection pool
pub async fn revoke_refresh_token(token: &str, reason: &str, pool: &PgPool) -> Result<()> {
    let token_hash = sha256_hash(token);

    sqlx::query!(
        "UPDATE refresh_tokens SET revoked_at = NOW(), revoked_reason = $1 WHERE token_hash = $2",
        reason,
        token_hash
    )
    .execute(pool)
    .await
    .context("Failed to revoke token")?;

    Ok(())
}

/// Revoke all refresh tokens for a user
///
/// # Arguments
/// * `user_id` - User's UUID
/// * `reason` - Reason for revocation
/// * `pool` - Database connection pool
pub async fn revoke_all_user_tokens(user_id: Uuid, reason: &str, pool: &PgPool) -> Result<()> {
    sqlx::query!(
        r#"
        UPDATE refresh_tokens
        SET revoked_at = NOW(), revoked_reason = $1
        WHERE user_id = $2 AND revoked_at IS NULL
        "#,
        reason,
        user_id.to_string()
    )
    .execute(pool)
    .await
    .context("Failed to revoke user tokens")?;

    Ok(())
}

/// Cleanup expired refresh tokens (should be run periodically)
///
/// # Arguments
/// * `pool` - Database connection pool
///
/// # Returns
/// Number of tokens deleted
pub async fn cleanup_expired_tokens(pool: &PgPool) -> Result<u64> {
    let result = sqlx::query!("DELETE FROM refresh_tokens WHERE expires_at < NOW()")
        .execute(pool)
        .await
        .context("Failed to cleanup expired tokens")?;

    Ok(result.rows_affected())
}

/// Limit number of active tokens per user (revoke oldest if exceeds limit)
///
/// # Arguments
/// * `user_id` - User's UUID
/// * `max_tokens` - Maximum number of active tokens allowed
/// * `pool` - Database connection pool
pub async fn limit_user_tokens(user_id: Uuid, max_tokens: i64, pool: &PgPool) -> Result<()> {
    sqlx::query!(
        r#"
        UPDATE refresh_tokens
        SET revoked_at = NOW(), revoked_reason = 'token_limit_exceeded'
        WHERE token_hash IN (
            SELECT token_hash
            FROM refresh_tokens
            WHERE user_id = $1
              AND revoked_at IS NULL
              AND expires_at > NOW()
            ORDER BY created_at ASC
            LIMIT (
                SELECT GREATEST(0, COUNT(*) - $2)
                FROM refresh_tokens
                WHERE user_id = $1
                  AND revoked_at IS NULL
                  AND expires_at > NOW()
            )
        )
        "#,
        user_id.to_string(),
        max_tokens
    )
    .execute(pool)
    .await
    .context("Failed to limit user tokens")?;

    Ok(())
}
