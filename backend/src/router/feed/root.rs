use axum::{
    extract::{Query, State},
    routing::{get, post},
    Router,
};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    dto::feed::{CreateFeedReactionDto, FeedQueryDto, ReadFeedEventDto},
    router::{clerk::ClerkUser, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedQuery {
    pub cursor: Option<DateTime<Local>>,
    pub limit: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, validator::Validate)]
pub struct RemoveReactionRequest {
    pub feed_event_id: Uuid,
    #[validate(length(min = 1, max = 10))]
    pub emoji: String,
}

pub fn feed_router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_friends_feed_handler))
        .route("/reaction", post(add_reaction_handler))
        .route("/reaction/remove", post(remove_reaction_handler))
}

async fn get_friends_feed_handler(
    State(state): State<AppState>,
    Query(query): Query<FeedQuery>,
    actor: ClerkUser,
) -> ApiResponse<Vec<ReadFeedEventDto>> {
    let dto = FeedQueryDto {
        cursor: query.cursor,
        limit: query.limit,
    };

    let result = state.feed_service.get_friends_feed(dto, actor).await;
    ApiResponse::from_result(result)
}

async fn add_reaction_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<CreateFeedReactionDto>,
) -> ApiResponse<()> {
    let result = state.feed_service.add_reaction(payload, actor).await;
    match result {
        Ok(_) => ApiResponse::Success { data: () },
        Err(e) => ApiResponse::Error {
            message: e.to_string(),
        },
    }
}

async fn remove_reaction_handler(
    State(state): State<AppState>,
    actor: ClerkUser,
    ValidatedRequest(payload): ValidatedRequest<RemoveReactionRequest>,
) -> ApiResponse<()> {
    let result = state
        .feed_service
        .remove_reaction(payload.feed_event_id, payload.emoji, actor)
        .await;

    match result {
        Ok(_) => ApiResponse::Success { data: () },
        Err(e) => ApiResponse::Error {
            message: e.to_string(),
        },
    }
}
