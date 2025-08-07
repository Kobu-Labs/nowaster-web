use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::user::read_user::ReadUserDto;
use crate::entity::category::Category;
use crate::entity::tag::Tag;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "event_type", content = "event_data", rename_all = "snake_case")]
pub enum FeedEventType {
    SessionCompleted(SessionEventData),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(
    tag = "source_type",
    content = "source_data",
    rename_all = "snake_case"
)]
pub enum FeedEventSource {
    User(ReadUserDto),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedEvent {
    pub id: Uuid,
    #[serde(flatten)]
    pub source: FeedEventSource,
    #[serde(flatten)]
    pub data: FeedEventType,
    pub created_at: DateTime<Local>,
}

// possible events
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SessionEventData {
    pub session_id: Uuid,
    pub category: Category,
    pub tags: Vec<Tag>,
    pub description: Option<String>,
    pub start_time: DateTime<Local>,
    pub end_time: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedReaction {
    pub id: Uuid,
    pub feed_event_id: Uuid,
    pub user: ReadUserDto,
    pub emoji: String,
    pub created_at: DateTime<Local>,
}
