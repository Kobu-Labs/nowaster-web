use std::fmt::Display;

use anyhow::Result;
use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use clerk_rs::validators::authorizer::ClerkJwt;
use sqlx::Type;

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
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        if let Some(session) = parts.extensions.get::<ClerkJwt>() {
            let actor_result = state
                .user_service
                .get_actor_by_id(session.sub.clone())
                .await;

            let Ok(Some(actor)) = actor_result else {
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            };

            Ok(actor)
        } else {
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
