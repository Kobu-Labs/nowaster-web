use std::fmt::Display;
use std::str::FromStr;

use anyhow::Result;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use sqlx::Type;

use super::root::AppState;
use crate::auth::validate_access_token;

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

/// Optional Actor extractor - returns None if authentication fails instead of rejecting the request
#[derive(Debug, Clone)]
pub struct OptionalActor(pub Option<Actor>);

impl FromRequestParts<AppState> for OptionalActor {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        // Try to extract Actor, but return None instead of rejecting
        match Actor::from_request_parts(parts, state).await {
            Ok(actor) => Ok(OptionalActor(Some(actor))),
            Err(_) => Ok(OptionalActor(None)),
        }
    }
}

impl FromRequestParts<AppState> for Actor {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        if let Some(impersonation_token) = parts
            .headers
            .get("X-Impersonation-Token")
            .and_then(|h| h.to_str().ok())
        {
            if let Ok(Some((target_user_id, admin_user_id))) = state
                .auth_service
                .validate_impersonation_token(impersonation_token)
                .await
            {
                let role = UserRole::User;
                return Ok(Actor {
                    user_id: target_user_id,
                    role,
                });
            }
        }

        if let Some(auth_header) = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .and_then(|h| h.strip_prefix("Bearer "))
        {
            if let Ok(claims) = validate_access_token(auth_header) {
                let role = UserRole::from_str(&claims.role).unwrap_or(UserRole::User);
                return Ok(Actor {
                    user_id: claims.sub,
                    role,
                });
            }
        }

        if let Some(api_key) = parts.headers.get("X-API-Key").and_then(|h| h.to_str().ok()) {
            if let Ok((user_id, role)) = state.auth_service.validate_api_token(api_key).await {
                return Ok(Actor { user_id, role });
            }
        }

        Err(StatusCode::UNAUTHORIZED)
    }
}
