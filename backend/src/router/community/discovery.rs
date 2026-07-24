use axum::{
    extract::{Query, State},
    routing::get,
    Router,
};
use tracing::instrument;

use crate::{
    dto::community::discover::{
        CategoryAutocompleteDto, DiscoverCommunitiesDto, DiscoverCommunitiesResultDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn discovery_routes() -> Router<AppState> {
    Router::new()
        .route("/discover", get(discover_communities_handler))
        .route("/discover/categories", get(autocomplete_categories_handler))
}

#[instrument(skip(state), fields(user_id = %actor, query = ?payload.query, sort = ?payload.sort))]
async fn discover_communities_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<DiscoverCommunitiesDto>,
) -> ApiResponse<DiscoverCommunitiesResultDto> {
    let result = state.community_service.discover_communities(payload, &actor).await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, prefix = %payload.prefix))]
async fn autocomplete_categories_handler(
    State(state): State<AppState>,
    actor: Actor,
    Query(payload): Query<CategoryAutocompleteDto>,
) -> ApiResponse<Vec<String>> {
    let result = state
        .community_service
        .autocomplete_categories(&payload.prefix)
        .await;
    ApiResponse::from_result(result)
}
