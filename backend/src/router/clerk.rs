use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use clerk_rs::validators::authorizer::ClerkJwt;

use crate::dto::user::create_user::CreateUserDto;

use super::root::AppState;

#[derive(Debug, Clone)]
pub struct ClerkUser {
    pub user_id: String,
}

impl FromRequestParts<AppState> for ClerkUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        if let Some(session) = parts.extensions.get::<ClerkJwt>() {
            state
                .user_service
                .upsert(CreateUserDto {
                    displayname: "unspecified".to_string(),
                    clerk_user_id: session.sub.clone(),
                })
                .await
                .map_err(|e| {
                    println!("Error creating user: {:?}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
            Ok(ClerkUser {
                user_id: session.sub.clone(),
            })
        } else {
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
