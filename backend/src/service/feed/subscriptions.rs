use std::collections::HashMap;

use anyhow::Result;

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
    router::clerk::ClerkUser,
    service::user_service::UserService,
};

#[derive(Clone)]
pub struct FeedSubscriptionService {
    feed_repository: FeedRepository,
    user_service: UserRepository,
}

impl FeedSubscriptionService {
    pub async fn update_subscription(
        &self,
        dto: UpdateFeedSubscriptionDto,
        actor: ClerkUser,
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

    pub async fn subscribe(&self, source: AddFeedSource, actor: ClerkUser) -> Result<()> {
        self.feed_repository.subscribe(source, actor).await
    }

    pub async fn unsubscribe(&self, source: RemoveFeedSource, actor: ClerkUser) -> Result<()> {
        self.feed_repository.unsubscribe(source, actor).await
    }

    pub fn new(repo: FeedRepository, user_service: UserRepository) -> Self {
        Self {
            user_service,
            feed_repository: repo,
        }
    }

    pub async fn get_user_subscriptions(
        &self,
        actor: ClerkUser,
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
                .or_insert_with(Vec::new)
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
