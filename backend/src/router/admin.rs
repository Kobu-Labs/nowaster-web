use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};

use super::{clerk::Actor, root::AppState};

pub struct AdminUser(pub Actor);

impl FromRequestParts<AppState> for AdminUser {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let actor = Actor::from_request_parts(parts, state).await?;

        if actor.is_admin() {
            Ok(AdminUser(actor))
        } else {
            Err(StatusCode::FORBIDDEN)
        }
    }
}