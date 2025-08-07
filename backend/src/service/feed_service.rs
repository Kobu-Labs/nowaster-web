use anyhow::Result;
use std::{collections::HashMap, sync::Arc};
use uuid::Uuid;

use crate::{
    config::database::Database,
    dto::{
        feed::{
            CreateFeedEventDto, CreateFeedReactionDto, FeedQueryDto, ReadFeedEventDto,
            ReadFeedReactionDto,
        },
        user::read_user::ReadUserDto,
    },
    entity::feed::{FeedEvent, FeedEventSource},
    repository::feed::{FeedRepository, FeedSubsriptionRow},
    router::clerk::ClerkUser,
    service::user_service::UserService,
};

#[derive(Clone)]
pub struct FeedService {
    feed_repository: FeedRepository,
}

impl FeedService {
    pub fn new(db: &Arc<Database>) -> Self {
        Self {
            feed_repository: FeedRepository::new(&db),
        }
    }

    pub async fn get_subscriptions(
        &self,
        event_source: FeedEventSource,
    ) -> Result<Vec<FeedSubsriptionRow>> {
        self.feed_repository.get_subscriptions(event_source).await
    }

    pub async fn publish_event(&self, event: CreateFeedEventDto) -> Result<()> {
        self.feed_repository.create_feed_event(event).await?;
        Ok(())
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
}
