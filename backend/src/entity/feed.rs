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
    pub category: FeedSessionCategory,
    pub tags: Vec<FeedSessionTag>,
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

// INFO: mock objects to prevent growing dependencies
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedSessionCategory {
    pub id: Uuid,
    pub name: String,
    pub color: String,
}

// INFO: mock objects to prevent growing dependencies
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedSessionTag {
    pub id: Uuid,
    pub label: String,
    pub color: String,
}

impl From<Tag> for FeedSessionTag {
    fn from(tag: Tag) -> Self {
        Self {
            id: tag.id,
            label: tag.label,
            color: tag.color,
        }
    }
}
impl From<Category> for FeedSessionCategory {
    fn from(category: Category) -> Self {
        Self {
            id: category.id,
            name: category.name,
            color: category.color,
        }
    }
}
