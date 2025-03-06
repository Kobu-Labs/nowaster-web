use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use clerk_rs::validators::authorizer::ClerkJwt;

use super::root::AppState;

#[derive(Debug, Clone)]
pub struct ClerkUser {
    pub user_id: String,
}

impl FromRequestParts<AppState> for ClerkUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        if let Some(session) = parts.extensions.get::<ClerkJwt>() {
            Ok(ClerkUser {
                user_id: session.sub.clone(),
            })
        } else {
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
