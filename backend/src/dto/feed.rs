use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::user::read_user::ReadUserDto,
    entity::{
        feed::{FeedEvent, FeedEventSource, FeedEventType, FeedReaction},
        visibility::VisibilityFlags,
    },
};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadFeedEventDto {
    pub id: Uuid,
    #[serde(flatten)]
    pub source: FeedEventSource,
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
    pub id: Option<Uuid>,
    #[serde(flatten)]
    pub source: FeedEventSource,
    #[serde(flatten)]
    pub data: FeedEventType,
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

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum AddFeedSource {
    User(String),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub enum RemoveFeedSource {
    User(String),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadFeedSubscriptionDto {
    pub id: uuid::Uuid,
    #[serde(flatten)]
    pub source: FeedEventSource,
    pub is_muted: bool,
    pub is_paused: bool,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug, validator::Validate)]
pub struct UpdateFeedSubscriptionDto {
    pub subscription_id: uuid::Uuid,
    pub is_muted: Option<bool>,
    pub is_paused: Option<bool>,
}

impl From<FeedEvent> for ReadFeedEventDto {
    fn from(event: FeedEvent) -> Self {
        Self {
            id: event.id,
            source: event.source,
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
                id: reaction.user.id.clone(),
                username: reaction.user.username,
                avatar_url: reaction.user.avatar_url,
                visibility_flags: VisibilityFlags::default(),
            },
            emoji: reaction.emoji,
            created_at: reaction.created_at,
        }
    }
}
