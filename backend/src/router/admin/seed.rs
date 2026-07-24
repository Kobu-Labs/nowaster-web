use axum::{extract::Query, routing::post, Router};
use serde::Deserialize;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::env::AppEnvironment,
    router::{response::ApiResponse, root::AppState},
};

pub fn admin_seed_router() -> Router<AppState> {
    Router::new().route("/communities", post(seed_communities_handler))
}

#[derive(Debug, Deserialize)]
struct SeedCommunitiesParams {
    member_id: Option<String>,
}

/// Dev/testing utility: seeds a handful of demo communities (with membership,
/// invite codes, tracked categories, and category mappings against existing
/// session data) without truncating anything else. Reuses the same seeding
/// code path the sandbox reset cycle uses, so it works identically on a
/// local dev database. Pass `?member_id=<user id>` to fold a specific user
/// in as a member of every seeded community.
///
/// Intentionally unauthenticated for local testing convenience, but disabled
/// outside local/sandbox environments so it can never be hit in production.
#[instrument(skip(state))]
async fn seed_communities_handler(
    axum::extract::State(state): axum::extract::State<AppState>,
    Query(params): Query<SeedCommunitiesParams>,
) -> ApiResponse<Vec<Uuid>> {
    if !matches!(
        state.config.server.app_env,
        AppEnvironment::NowasterLocal | AppEnvironment::NowasterSandbox
    ) {
        return ApiResponse::Error {
            message: "Not available in this environment".to_string(),
        };
    }

    match state
        .sandbox_service
        .seed_demo_communities(params.member_id.as_deref())
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
