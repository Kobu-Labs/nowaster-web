use std::collections::HashMap;

use anyhow::Result;
use tracing::instrument;

use crate::{
    dto::{
        feed::{
            AddFeedSource, ReadFeedSubscriptionDto, RemoveFeedSource, UpdateFeedSubscriptionDto,
        },
        user::read_user::ReadUserDto,
    },
    entity::feed::FeedEventSource,
    repository::{
        feed::{FeedRepository, FeedSourceSqlType},
        user::{FilterUsersDto, IdFilter, UserRepository},
    },
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct FeedSubscriptionService {
    feed_repository: FeedRepository,
    user_service: UserRepository,
}

impl FeedSubscriptionService {
    #[instrument(err, skip(self), fields(subscription_id = %dto.subscription_id, actor_id = %actor))]
    pub async fn update_subscription(
        &self,
        dto: UpdateFeedSubscriptionDto,
        actor: Actor,
    ) -> Result<()> {
        self.feed_repository
            .update_subscription(
                dto.subscription_id,
                actor.user_id,
                dto.is_muted,
                dto.is_paused,
            )
            .await
    }

    #[instrument(err, skip(self), fields(subscriber_id = %subscriber_id))]
    pub async fn subscribe(&self, source: AddFeedSource, subscriber_id: String) -> Result<()> {
        self.feed_repository.subscribe(source, subscriber_id).await
    }

    #[instrument(err, skip(self), fields(subscriber_id = %subscriber_id))]
    pub async fn unsubscribe(&self, source: RemoveFeedSource, subscriber_id: String) -> Result<()> {
        self.feed_repository
            .unsubscribe(source, subscriber_id)
            .await
    }

    pub fn new(repo: FeedRepository, user_service: UserRepository) -> Self {
        Self {
            user_service,
            feed_repository: repo,
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_user_subscriptions(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadFeedSubscriptionDto>> {
        let subs_ids = self
            .feed_repository
            .get_user_subscriptions(actor.user_id)
            .await?;

        let mut sources_by_type: std::collections::HashMap<FeedSourceSqlType, Vec<String>> =
            std::collections::HashMap::new();
        for subscription in &subs_ids {
            sources_by_type
                .entry(subscription.source_type.clone())
                .or_default()
                .push(subscription.source_id.clone());
        }

        // Fetch all users at once
        let mut user_lookup = HashMap::new();
        if let Some(user_ids) = sources_by_type.get(&FeedSourceSqlType::User) {
            let users = self
                .user_service
                .filter_users(FilterUsersDto {
                    id: Some(IdFilter::Many(user_ids.clone())),
                    ..Default::default()
                })
                .await?;

            for user in users {
                user_lookup.insert(user.id.clone(), user);
            }
        }

        let subscriptions = subs_ids
            .into_iter()
            .map(|row| ReadFeedSubscriptionDto {
                id: row.id,
                source: match row.source_type {
                    FeedSourceSqlType::User => {
                        let user = user_lookup.get(&row.source_id);
                        FeedEventSource::User(ReadUserDto {
                            id: row.source_id.clone(),
                            username: user.map(|u| u.username.clone()).unwrap_or_default(),
                            avatar_url: user.and_then(|u| u.avatar_url.clone()),
                            visibility_flags: user.map(|u| u.visibility_flags).unwrap_or_default(),
                        })
                    }
                },
                is_muted: row.is_muted,
                is_paused: row.is_paused,
                created_at: row.created_at,
            })
            .collect();

        Ok(subscriptions)
    }
}
