use axum::{
    extract::{Path, Query, State},
    routing::{get, post},
    Router,
};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    dto::notification::{
        MarkNotificationsSeenDto, NotificationCountDto, NotificationQueryDto, ReadNotificationDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationQuery {
    pub cursor: Option<DateTime<Local>>,
    pub limit: Option<i64>,
    pub seen: Option<bool>,
}

impl From<NotificationQuery> for NotificationQueryDto {
    fn from(query: NotificationQuery) -> Self {
        Self {
            cursor: query.cursor,
            limit: query.limit,
            seen: query.seen,
        }
    }
}

async fn get_notifications(
    State(state): State<AppState>,
    user: Actor,
    Query(query): Query<NotificationQuery>,
) -> ApiResponse<Vec<ReadNotificationDto>> {
    let notifications = state
        .notification_service
        .get_notifications(user.user_id, query.into())
        .await;

    ApiResponse::from_result(notifications)
}

async fn get_unseen_notifications(
    State(state): State<AppState>,
    user: Actor,
    Query(query): Query<NotificationQuery>,
) -> ApiResponse<Vec<ReadNotificationDto>> {
    let notifications = state
        .notification_service
        .get_unseen_notifications(user.user_id, query.limit)
        .await;

    ApiResponse::from_result(notifications)
}

async fn get_notification_counts(
    State(state): State<AppState>,
    user: Actor,
) -> ApiResponse<NotificationCountDto> {
    let counts = state
        .notification_service
        .get_notification_counts(user.user_id)
        .await;

    ApiResponse::from_result(counts)
}

async fn mark_notifications_seen(
    State(state): State<AppState>,
    user: Actor,
    ValidatedRequest(dto): ValidatedRequest<MarkNotificationsSeenDto>,
) -> ApiResponse<()> {
    let updated_count = state
        .notification_service
        .mark_notifications_seen(dto, user)
        .await;

    ApiResponse::Success { data: () }
}

async fn delete_notification(
    State(state): State<AppState>,
    user: Actor,
    Path(notification_id): Path<Uuid>,
) -> ApiResponse<()> {
    let deleted = state
        .notification_service
        .delete_notification(notification_id, user)
        .await;

    ApiResponse::Success { data: () }
}

pub fn notification_router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_notifications))
        .route("/unseen", get(get_unseen_notifications))
        .route("/count", get(get_notification_counts))
        .route("/mark_seen", post(mark_notifications_seen))
        .route("/{:id}", axum::routing::delete(delete_notification))
}

