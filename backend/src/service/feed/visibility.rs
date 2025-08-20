use anyhow::Result;
use tracing::instrument;

use crate::{repository::feed::FeedRepository, service::friend_service::ReadFriendshipDto};

#[derive(Clone)]
pub struct FeedVisibilityService {
    feed_repository: FeedRepository,
}

impl FeedVisibilityService {
    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn recalculate_visibility(&self, user_id: String) -> Result<u64> {
        self.feed_repository.recalculate_visibility(user_id).await
    }

    #[instrument(err, skip(self), fields(friend1_id = %friendship.friend1.id, friend2_id = %friendship.friend2.id))]
    pub async fn recalculate_friendship_visibility(
        &self,
        friendship: ReadFriendshipDto,
    ) -> Result<()> {
        self.recalculate_visibility(friendship.friend1.id).await;
        self.recalculate_visibility(friendship.friend2.id).await;

        Ok(())
    }

    pub fn new(repo: FeedRepository) -> Self {
        Self {
            feed_repository: repo,
        }
    }
}
