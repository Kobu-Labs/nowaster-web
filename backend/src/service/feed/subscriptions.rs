use anyhow::Result;
use tracing::instrument;

use crate::{
    dto::feed::{AddFeedSource, ReadFeedSubscriptionDto, RemoveFeedSource, UpdateFeedSubscriptionDto},
    entity::feed::FeedEventSource,
    repository::{feed::FeedRepository, user::UserRepository},
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct FeedSubscriptionService {
    feed_repo: FeedRepository,
    user_repo: UserRepository,
}

impl FeedSubscriptionService {
    pub fn new(feed_repo: FeedRepository, user_repo: UserRepository) -> Self {
        Self {
            feed_repo,
            user_repo,
        }
    }

    pub async fn subscribe(&self, source: AddFeedSource, subscriber_id: &str) -> Result<()> {
        self.feed_repo.subscribe(source, subscriber_id).await
    }

    pub async fn unsubscribe(&self, source: RemoveFeedSource, subscriber_id: &str) -> Result<()> {
        self.feed_repo.unsubscribe(source, subscriber_id).await
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_user_subscriptions(&self, actor: &Actor) -> Result<Vec<ReadFeedSubscriptionDto>> {
        let rows = self.feed_repo.get_user_subscriptions(&actor.user_id).await?;

        let user_ids: Vec<String> = rows
            .iter()
            .filter(|r| matches!(r.source_type, crate::repository::feed::FeedSourceSqlType::User))
            .map(|r| r.source_id.clone())
            .collect();

        let users = if user_ids.is_empty() {
            vec![]
        } else {
            self.user_repo
                .filter_users(crate::repository::user::FilterUsersDto {
                    id: Some(crate::repository::user::IdFilter::Many(user_ids)),
                    ..Default::default()
                })
                .await?
        };

        let result = rows
            .into_iter()
            .filter_map(|row| {
                let source = match row.source_type {
                    crate::repository::feed::FeedSourceSqlType::User => {
                        let user = users.iter().find(|u| u.id == row.source_id)?.clone();
                        FeedEventSource::User(user.into())
                    }
                };

                Some(ReadFeedSubscriptionDto {
                    id: row.id,
                    source,
                    is_muted: row.is_muted,
                    is_paused: row.is_paused,
                    created_at: row.created_at,
                })
            })
            .collect();

        Ok(result)
    }

    #[instrument(err, skip(self), fields(actor_id = %actor, subscription_id = %payload.subscription_id))]
    pub async fn update_subscription(
        &self,
        payload: UpdateFeedSubscriptionDto,
        actor: &Actor,
    ) -> Result<()> {
        self.feed_repo
            .update_subscription(
                payload.subscription_id,
                &actor.user_id,
                payload.is_muted,
                payload.is_paused,
            )
            .await
    }
}
