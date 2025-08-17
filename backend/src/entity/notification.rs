use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::user::read_user::ReadUserDto;

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "notification_type")]
#[serde(rename_all = "kebab-case")]
pub enum NotificationTypeSql {
    #[sqlx(rename = "friend:new_request")]
    #[serde(rename = "friend:new_request")]
    FriendNewRequest,

    #[sqlx(rename = "friend:request_accepted")]
    #[serde(rename = "friend:request_accepted")]
    FriendRequestAccepted,

    #[sqlx(rename = "session:reaction_added")]
    #[serde(rename = "session:reaction_added")]
    SessionReactionAdded,

    #[sqlx(rename = "system:new_release")]
    #[serde(rename = "system:new_release")]
    SystemNewRelease,
}

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "notification_source_type")]
#[serde(rename_all = "lowercase")]
pub enum NotificationSourceTypeSql {
    #[sqlx(rename = "user")]
    User,

    #[sqlx(rename = "system")]
    System,
}

// Typed notification data structures
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FriendRequestData {
    pub requester_username: String,
    pub message: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FriendRequestAcceptedData {
    pub accepter_username: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SessionReactionData {
    pub reactor_username: String,
    pub session_id: Uuid,
    pub session_description: Option<String>,
    pub emoji: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SystemReleaseData {
    pub version: String,
    pub title: String,
    pub description: String,
    pub features: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "notification_type", content = "data", rename_all = "kebab-case")]
pub enum NotificationType {
    #[serde(rename = "friend:new_request")]
    FriendNewRequest(FriendRequestData),

    #[serde(rename = "friend:request_accepted")]
    FriendRequestAccepted(FriendRequestAcceptedData),

    #[serde(rename = "session:reaction_added")]
    SessionReactionAdded(SessionReactionData),

    #[serde(rename = "system:new_release")]
    SystemNewRelease(SystemReleaseData),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SystemNotificationData {
    pub system_id: String,
    pub system_name: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "source_type", content = "source_data", rename_all = "lowercase")]
pub enum NotificationSource {
    User(ReadUserDto),
    System(SystemNotificationData),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: String,
    #[serde(flatten)]
    pub source: NotificationSource,
    #[serde(flatten)]
    pub notification_type: NotificationType,
    pub seen: bool,
    pub created_at: DateTime<Local>,
}

