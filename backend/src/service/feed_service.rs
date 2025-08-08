use anyhow::Result;
use std::{collections::HashMap, sync::Arc};
use uuid::Uuid;

use crate::{
    config::database::Database,
    dto::{
        feed::{
            AddFeedSource, CreateFeedEventDto, CreateFeedReactionDto, FeedQueryDto,
            ReadFeedEventDto, ReadFeedReactionDto, ReadFeedSubscriptionDto, RemoveFeedSource,
            UpdateFeedSubscriptionDto,
        },
        user::read_user::ReadUserDto,
    },
    entity::feed::FeedEventSource,
    repository::{
        feed::{FeedRepository, FeedSourceSqlType, FeedSubscriptionRow},
        user::{FilterUsersDto, IdFilter, UserRepository},
    },
    router::clerk::ClerkUser,
    service::user_service::{self, UserService},
};

#[derive(Clone)]
pub struct FeedService {
    feed_repository: FeedRepository,
    user_service: UserService,
}

impl FeedService {
    pub fn new(db: &Arc<Database>, user_service: UserService) -> Self {
        Self {
            feed_repository: FeedRepository::new(&db),
            user_service,
        }
    }

    pub async fn publish_event(&self, event: CreateFeedEventDto) -> Result<()> {
        self.feed_repository.create_feed_event(event).await?;
        Ok(())
    }

    pub async fn subscribe(&self, source: AddFeedSource, actor: ClerkUser) -> Result<()> {
        self.feed_repository.subscribe(source, actor).await
    }

    pub async fn unsubscribe(
        &self,
        source: RemoveFeedSource,
        actor: ClerkUser,
    ) -> Result<()> {
        self.feed_repository.unsubscribe(source, actor).await
    }

    pub async fn get_friends_feed(
        &self,
        query: FeedQueryDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadFeedEventDto>> {
        let events = self
            .feed_repository
            .get_feed(actor.user_id.clone(), query)
            .await?;

        if events.is_empty() {
            return Ok(vec![]);
        }

        // Get reactions for all events
        let event_ids: Vec<Uuid> = events.iter().map(|e| e.id).collect();
        let reactions = self.feed_repository.get_event_reactions(&event_ids).await?;

        // Group reactions by event
        let mut reactions_by_event: HashMap<Uuid, Vec<ReadFeedReactionDto>> = HashMap::new();
        for reaction in reactions {
            let reaction_dto = ReadFeedReactionDto {
                id: reaction.id,
                user: reaction.user,
                emoji: reaction.emoji,
                created_at: reaction.created_at,
            };

            reactions_by_event
                .entry(reaction.feed_event_id)
                .or_insert(Vec::new())
                .push(reaction_dto);
        }

        // Build final feed events
        let feed_events = events
            .into_iter()
            .map(|event| {
                let event_reactions = reactions_by_event
                    .get(&event.id)
                    .cloned()
                    .unwrap_or_default();

                ReadFeedEventDto {
                    id: event.id,
                    source: event.source,
                    data: event.data.clone(),
                    created_at: event.created_at,
                    reactions: event_reactions,
                }
            })
            .collect();

        Ok(feed_events)
    }

    pub async fn add_reaction(&self, dto: CreateFeedReactionDto, actor: ClerkUser) -> Result<()> {
        self.feed_repository
            .create_reaction(dto, actor.clone())
            .await?;

        Ok(())
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
            let users = self.user_service.get_users_by_ids(user_ids.clone()).await?;

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
}
