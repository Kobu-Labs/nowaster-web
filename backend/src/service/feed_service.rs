use anyhow::Result;
use std::{collections::HashMap, sync::Arc};
use uuid::Uuid;

use crate::{
    config::database::Database,
    dto::feed::{
        CreateFeedEventDto, CreateFeedReactionDto, FeedQueryDto, ReadFeedEventDto,
        ReadFeedReactionDto,
    },
    entity::feed::FeedEvent,
    repository::feed::FeedRepository,
    router::clerk::ClerkUser,
    service::{friend_service::ReadUserAvatarDto, user_service::UserService},
};

#[derive(Clone)]
pub struct FeedService {
    feed_repository: FeedRepository,
    user_service: UserService,
}

impl FeedService {
    pub fn new(db: &Arc<Database>, user_service: UserService) -> Self {
        Self {
            user_service,
            feed_repository: FeedRepository::new(&db),
        }
    }

    pub async fn publish_event(&self, event: FeedEvent, user_id: String) -> Result<()> {
        self.feed_repository
            .create_feed_event(CreateFeedEventDto { user_id, event })
            .await?;
        Ok(())
    }

    pub async fn get_friends_feed(
        &self,
        query: FeedQueryDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadFeedEventDto>> {
        let events = self
            .feed_repository
            .get_friends_feed(actor.user_id.clone(), query)
            .await?;

        if events.is_empty() {
            return Ok(vec![]);
        }

        // Get all unique user IDs from events
        let user_ids: Vec<String> = events
            .iter()
            .map(|e| e.user_id.clone())
            .collect::<std::collections::HashSet<_>>()
            .into_iter()
            .collect();

        // Get user information with avatars
        let users = self.get_users_with_avatars(user_ids).await?;
        let user_map: HashMap<String, ReadUserAvatarDto> =
            users.into_iter().map(|u| (u.id.clone(), u)).collect();

        // Get reactions for all events
        let event_ids: Vec<Uuid> = events.iter().map(|e| e.id).collect();
        let reactions = self.feed_repository.get_feed_reactions(&event_ids).await?;

        // Group reactions by event
        let mut reactions_by_event: HashMap<Uuid, Vec<ReadFeedReactionDto>> = HashMap::new();
        for reaction in reactions {
            let user =
                user_map
                    .get(&reaction.user_id)
                    .cloned()
                    .unwrap_or_else(|| ReadUserAvatarDto {
                        id: reaction.user_id.clone(),
                        username: "Unknown User".to_string(),
                        avatar_url: None,
                    });

            let reaction_dto = ReadFeedReactionDto {
                id: reaction.id,
                user,
                emoji: reaction.emoji,
                created_at: reaction.created_at,
            };

            reactions_by_event
                .entry(reaction.feed_event_id)
                .or_insert(Vec::new())
                .push(reaction_dto);
        }

        // Build final feed events
        let feed_events =
            events
                .into_iter()
                .map(|event| {
                    let user = user_map.get(&event.user_id).cloned().unwrap_or_else(|| {
                        ReadUserAvatarDto {
                            id: event.user_id.clone(),
                            username: "Unknown User".to_string(),
                            avatar_url: None,
                        }
                    });

                    let event_reactions = reactions_by_event
                        .get(&event.id)
                        .cloned()
                        .unwrap_or_default();

                    ReadFeedEventDto {
                        id: event.id,
                        user,
                        data: event.data.clone(),
                        created_at: event.created_at,
                        reactions: event_reactions,
                    }
                })
                .collect();

        Ok(feed_events)
    }

    pub async fn add_reaction(
        &self,
        dto: CreateFeedReactionDto,
        actor: ClerkUser,
    ) -> Result<ReadFeedReactionDto> {
        let reaction = self
            .feed_repository
            .create_reaction(dto, actor.clone())
            .await?;

        let user = self.get_user_with_avatar(actor.user_id).await?;

        Ok(ReadFeedReactionDto {
            id: reaction.id,
            user,
            emoji: reaction.emoji,
            created_at: reaction.created_at,
        })
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

    async fn get_users_with_avatars(
        &self,
        user_ids: Vec<String>,
    ) -> Result<Vec<ReadUserAvatarDto>> {
        // Use UserService to get users with avatars
        self.user_service
            .get_users_by_ids(user_ids)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get users with avatars: {}", e))
    }

    async fn get_user_with_avatar(&self, user_id: String) -> Result<ReadUserAvatarDto> {
        let users = self.get_users_with_avatars(vec![user_id]).await?;
        users
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("User not found"))
    }
}
