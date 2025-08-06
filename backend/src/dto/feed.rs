use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::user::read_user::ReadUserDto,
    entity::feed::{FeedEvent, FeedEventType, FeedReaction},
};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadFeedEventDto {
    pub id: Uuid,
    pub user: ReadUserDto,
    #[serde(flatten)]
    pub data: FeedEventType,
    pub created_at: DateTime<Local>,
    pub reactions: Vec<ReadFeedReactionDto>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadFeedReactionDto {
    pub id: Uuid,
    pub user: ReadUserDto,
    pub emoji: String,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CreateFeedEventDto {
    pub user_id: String,
    pub event: FeedEvent,
}

#[derive(Clone, Serialize, Deserialize, Debug, Validate)]
pub struct CreateFeedReactionDto {
    pub feed_event_id: Uuid,
    #[validate(length(min = 1, max = 10))]
    pub emoji: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedQueryDto {
    pub cursor: Option<DateTime<Local>>,
    pub limit: Option<i64>,
}

impl From<FeedEvent> for ReadFeedEventDto {
    fn from(event: FeedEvent) -> Self {
        Self {
            id: event.id,
            user: ReadUserDto {
                id: event.user_id.clone(),
                username: String::new(), // Will be filled by the service
                avatar_url: None,        // Will be filled by the service
            },
            data: event.data,
            created_at: event.created_at,
            reactions: vec![],
        }
    }
}

impl From<FeedReaction> for ReadFeedReactionDto {
    fn from(reaction: FeedReaction) -> Self {
        Self {
            id: reaction.id,
            user: ReadUserDto {
                id: reaction.user_id.clone(),
                username: String::new(), // Will be filled by the service
                avatar_url: None,        // Will be filled by the service
            },
            emoji: reaction.emoji,
            created_at: reaction.created_at,
        }
    }
}
