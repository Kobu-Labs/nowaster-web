use std::fmt::Display;
use std::str::FromStr;

use anyhow::Result;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use sqlx::Type;

use crate::auth::validate_access_token;
use super::root::AppState;

#[derive(Debug, Clone)]
pub struct Actor {
    pub user_id: String,
    pub role: UserRole,
}

impl Display for Actor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "user_id: {}, role: {:?}", self.user_id, self.role)
    }
}

#[derive(Debug, Clone, PartialEq, Type)]
#[sqlx(type_name = "user_role", rename_all = "lowercase")]
#[derive(Default)]
pub enum UserRole {
    #[default]
    User,
    Admin,
}

impl Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::User => write!(f, "user"),
            UserRole::Admin => write!(f, "admin"),
        }
    }
}

impl FromStr for UserRole {
    type Err = anyhow::Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "user" => Ok(UserRole::User),
            "admin" => Ok(UserRole::Admin),
            _ => Ok(UserRole::User), // Default to user for unknown roles
        }
    }
}


impl Actor {
    pub fn is_admin(&self) -> bool {
        matches!(self.role, UserRole::Admin)
    }

    pub fn can_access_admin_features(&self) -> bool {
        self.is_admin()
    }
}

impl FromRequestParts<AppState> for Actor {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        // Extract Authorization header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
            .ok_or(StatusCode::UNAUTHORIZED)?;

        // Validate JWT and extract claims
        let claims = validate_access_token(auth_header)
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        // Parse user_id and role from claims
        let user_id = claims.sub;
        let role = UserRole::from_str(&claims.role)
            .unwrap_or(UserRole::User);

        Ok(Actor { user_id, role })
    }
}
