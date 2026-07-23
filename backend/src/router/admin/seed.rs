use axum::{routing::post, Router};
use tracing::instrument;
use uuid::Uuid;

use crate::router::{admin::AdminUser, response::ApiResponse, root::AppState};

pub fn admin_seed_router() -> Router<AppState> {
    Router::new().route("/communities", post(seed_communities_handler))
}

/// Dev/admin utility: seeds a handful of demo communities (with membership,
/// invite codes, tracked categories, and category mappings against existing
/// session data) without truncating anything else. The calling admin is
/// folded in as a member so the result is immediately visible in their own
/// account. Reuses the same seeding code path the sandbox reset cycle uses,
/// so it works identically on a local dev database.
#[instrument(skip(state, admin))]
async fn seed_communities_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    AdminUser(admin): AdminUser,
) -> ApiResponse<Vec<Uuid>> {
    match state
        .sandbox_service
        .seed_demo_communities(Some(&admin.user_id))
        .await
    {
        Ok(community_ids) => ApiResponse::Success {
            data: community_ids,
        },
        Err(e) => {
            tracing::error!("Failed to seed demo communities: {}", e);
            ApiResponse::Error {
                message: "Failed to seed demo communities".to_string(),
            }
        }
    }
}
