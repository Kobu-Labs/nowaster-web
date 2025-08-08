use anyhow::Result;

use crate::repository::feed::FeedRepository;

#[derive(Clone)]
pub struct FeedVisibilityService {
    feed_repository: FeedRepository,
}

impl FeedVisibilityService {
    pub async fn recalculate_visibility(&self, user_id: String) -> Result<u64> {
        self.feed_repository.recalculate_visibility(user_id).await
    }

    pub fn new(repo: FeedRepository) -> Self {
        Self {
            feed_repository: repo,
        }
    }
}
