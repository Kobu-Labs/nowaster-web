use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::notification::{Notification, NotificationSource, NotificationType};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadNotificationDto {
    pub id: Uuid,
    pub user_id: String,
    #[serde(flatten)]
    pub source: NotificationSource,
    #[serde(flatten)]
    pub notification_type: NotificationType,
    pub seen: bool,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug, Validate)]
pub struct CreateNotificationDto {
    pub user_id: String,
    #[serde(flatten)]
    pub source: NotificationSource,
    #[serde(flatten)]
    pub notification_type: NotificationType,
}

#[derive(Clone, Serialize, Deserialize, Debug, Validate)]
pub struct MarkNotificationsSeenDto {
    #[validate(length(min = 1, max = 100, message = "Must provide 1-100 notification IDs"))]
    pub notification_ids: Vec<Uuid>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct NotificationQueryDto {
    pub cursor: Option<DateTime<Local>>,
    pub limit: Option<i64>,
    pub seen: Option<bool>, // Filter by seen status
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct NotificationCountDto {
    pub unseen_count: i64,
    pub total_count: i64,
}

impl From<Notification> for ReadNotificationDto {
    fn from(notification: Notification) -> Self {
        Self {
            id: notification.id,
            user_id: notification.user_id,
            source: notification.source,
            notification_type: notification.notification_type,
            seen: notification.seen,
            created_at: notification.created_at,
        }
    }
}
