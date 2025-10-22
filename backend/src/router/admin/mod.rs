pub mod routes;

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
        if let Some(impersonation_token) = parts
            .headers
            .get("X-Impersonation-Token")
            .and_then(|h| h.to_str().ok())
        {
            if let Ok(Some((_target_user_id, admin_user_id))) = state
                .auth_service
                .validate_impersonation_token(impersonation_token)
                .await
            {
                let admin_actor = state
                    .user_service
                    .get_actor_by_id(admin_user_id.clone())
                    .await
                    .map_err(|_| StatusCode::UNAUTHORIZED)?;

                if let Some((actor, _display_name)) = admin_actor {
                    if actor.is_admin() {
                        return Ok(AdminUser(actor));
                    }
                }
            }
            return Err(StatusCode::FORBIDDEN);
        }

        let actor = Actor::from_request_parts(parts, state).await?;

        if actor.is_admin() {
            Ok(AdminUser(actor))
        } else {
            Err(StatusCode::FORBIDDEN)
        }
    }
}
