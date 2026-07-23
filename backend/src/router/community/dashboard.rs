use axum::{
    extract::{Path, State},
    routing::get,
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community_dashboard::dashboard::CommunityDashboardDto,
    router::{clerk::Actor, response::ApiResponse, root::AppState},
};

pub fn dashboard_routes() -> Router<AppState> {
    Router::new().route(
        "/{community_id}/dashboard",
        get(get_community_dashboard_handler),
    )
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn get_community_dashboard_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<CommunityDashboardDto> {
    let result = state
        .community_dashboard_service
        .get_dashboard(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}
