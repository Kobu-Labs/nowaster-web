use anyhow::Result;
use std::collections::HashMap;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::feed::{CreateFeedEventDto, FeedQueryDto, ReadFeedEventDto, ReadFeedReactionDto},
    repository::feed::FeedRepository,
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct FeedEventService {
    feed_repository: FeedRepository,
}

impl FeedEventService {
    #[instrument(err, skip(self))]
    pub async fn publish_event(&self, event: CreateFeedEventDto) -> Result<()> {
        self.feed_repository.create_feed_event(event).await?;
        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn get_feed(
        &self,
        query: FeedQueryDto,
        actor: Actor,
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
                .or_default()
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
    pub fn new(repo: FeedRepository) -> Self {
        Self {
            feed_repository: repo,
        }
    }
}
