use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    dto::{feed::ReadFeedReactionDto, user::read_user::ReadUserDto},
    entity::category::Category,
};

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

    #[sqlx(rename = "task:completed")]
    #[serde(rename = "task:completed")]
    TaskCompleted,

    #[sqlx(rename = "project:completed")]
    #[serde(rename = "project:completed")]
    ProjectCompleted,
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

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FriendRequestData {
    pub requestor: ReadUserDto,
    pub message: Option<String>,
    pub request_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FriendRequestAcceptedData {
    pub accepter: ReadUserDto,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SessionReactionData {
    #[serde(flatten)]
    pub reaction: ReadFeedReactionDto,
    pub session_id: Uuid,
    pub session_category: Category,
    pub session_start_time: DateTime<Local>,
    pub session_end_time: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SystemReleaseData {
    pub release_id: Uuid,
    pub title: String,
    pub short_description: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TaskCompletedData {
    pub task_id: Uuid,
    pub task_name: String,
    pub project_name: String,
    pub total_hours: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ProjectCompletedData {
    pub project_id: Uuid,
    pub project_name: String,
    pub total_tasks: i64,
    pub total_hours: f64,
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

    #[serde(rename = "task:completed")]
    TaskCompleted(TaskCompletedData),

    #[serde(rename = "project:completed")]
    ProjectCompleted(ProjectCompletedData),
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
