use anyhow::Result;
use uuid::Uuid;

use crate::{
    dto::feed::CreateFeedReactionDto, repository::feed::FeedRepository, router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct FeedReactionService {
    feed_repository: FeedRepository,
}

impl FeedReactionService {
    pub async fn add_reaction(&self, dto: CreateFeedReactionDto, actor: ClerkUser) -> Result<()> {
        self.feed_repository.create_reaction(dto, actor).await
    }

    pub async fn remove_reaction(
        &self,
        feed_event_id: Uuid,
        emoji: String,
        actor: ClerkUser,
    ) -> Result<()> {
        self.feed_repository
            .remove_reaction(feed_event_id, emoji, actor)
            .await
    }
    pub fn new(repo: FeedRepository) -> Self {
        Self {
            feed_repository: repo,
        }
    }
}
