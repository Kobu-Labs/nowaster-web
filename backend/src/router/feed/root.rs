use axum::{
    extract::{Query, State},
    routing::{get, post},
    Router,
};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use tracing::{instrument, Level};
use uuid::Uuid;

use crate::{
    dto::feed::{
        CreateFeedReactionDto, FeedQueryDto, ReadFeedEventDto, ReadFeedSubscriptionDto,
        RemoveFeedSource, UpdateFeedSubscriptionDto,
    },
    repository::feed::FeedSourceSqlType,
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
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

#[derive(Debug, Serialize, Deserialize, validator::Validate)]
pub struct UnsubscribeRequest {
    pub source_id: String,
    pub source_type: FeedSourceSqlType,
}

pub fn feed_router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_feed_handler))
        .route("/reaction", post(add_reaction_handler))
        .route("/reaction/remove", post(remove_reaction_handler))
        .route("/subscriptions", get(get_subscriptions_handler))
        .route("/subscriptions", post(update_subscription_handler))
        .route("/subscriptions/unsubscribe", post(unsubscribe_handler))
}

#[instrument(skip(state), level = "info")]
async fn get_feed_handler(
    State(state): State<AppState>,
    Query(query): Query<FeedQuery>,
    actor: Actor,
) -> ApiResponse<Vec<ReadFeedEventDto>> {
    let dto = FeedQueryDto {
        cursor: query.cursor,
        limit: query.limit,
    };

    let result = state.feed.event_service.get_feed(dto, actor).await;
    ApiResponse::from_result(result)
}

async fn add_reaction_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateFeedReactionDto>,
) -> ApiResponse<()> {
    let result = state
        .feed
        .reaction_service
        .add_reaction(payload, actor)
        .await;
    match result {
        Ok(_) => ApiResponse::Success { data: () },
        Err(e) => ApiResponse::Error {
            message: e.to_string(),
        },
    }
}

async fn remove_reaction_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<RemoveReactionRequest>,
) -> ApiResponse<()> {
    let result = state
        .feed
        .reaction_service
        .remove_reaction(payload.feed_event_id, payload.emoji, actor)
        .await;

    match result {
        Ok(_) => ApiResponse::Success { data: () },
        Err(e) => ApiResponse::Error {
            message: e.to_string(),
        },
    }
}

async fn get_subscriptions_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadFeedSubscriptionDto>> {
    let result = state
        .feed
        .subscription_service
        .get_user_subscriptions(actor)
        .await;
    ApiResponse::from_result(result)
}

async fn update_subscription_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateFeedSubscriptionDto>,
) -> ApiResponse<()> {
    let result = state
        .feed
        .subscription_service
        .update_subscription(payload, actor)
        .await;
    match result {
        Ok(_) => ApiResponse::Success { data: () },
        Err(e) => ApiResponse::Error {
            message: e.to_string(),
        },
    }
}

async fn unsubscribe_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UnsubscribeRequest>,
) -> ApiResponse<()> {
    let source = match payload.source_type {
        FeedSourceSqlType::User => RemoveFeedSource::User(payload.source_id),
    };

    let result = state
        .feed
        .subscription_service
        .unsubscribe(source, actor.user_id)
        .await;
    match result {
        Ok(_) => ApiResponse::Success { data: () },
        Err(e) => ApiResponse::Error {
            message: e.to_string(),
        },
    }
}
