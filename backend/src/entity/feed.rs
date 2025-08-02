use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entity::category::Category;
use crate::entity::tag::Tag;

// Simplified structs for feed events - avoid dependency on full entity models
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedCategory {
    pub name: String,
    pub color: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedTag {
    pub label: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "event_type", content = "event_data", rename_all ="snake_case")]
pub enum FeedEventType {
    SessionCompleted(SessionEventData),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedEvent {
    pub id: Uuid,
    pub user_id: String,
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

// DTO for creating new session events with optional fields
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct NewSessionEventData {
    pub session_id: Uuid,
    pub session_type: String,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub tags: Vec<String>,
    pub description: Option<String>,
    pub start_time: DateTime<Local>,
    pub end_time: Option<DateTime<Local>>,
    pub duration_seconds: Option<i64>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedReaction {
    pub id: Uuid,
    pub feed_event_id: Uuid,
    pub user_id: String,
    pub emoji: String,
    pub created_at: DateTime<Local>,
}
