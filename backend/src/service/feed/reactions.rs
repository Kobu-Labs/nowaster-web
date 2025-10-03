use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::feed::{CreateFeedReactionDto, ReadFeedReactionDto},
    entity::feed::FeedEventType,
    repository::{feed::FeedRepository, fixed_session::FixedSessionRepository},
    router::clerk::Actor,
    service::notification_service::NotificationService,
};

#[derive(Clone)]
pub struct FeedReactionService {
    feed_repository: FeedRepository,
    notification_service: NotificationService,
    session_repo: FixedSessionRepository,
}

impl FeedReactionService {
    #[instrument(err, skip(self))]
    pub async fn add_reaction(&self, dto: CreateFeedReactionDto, actor: Actor) -> Result<()> {
        let reaction = self
            .feed_repository
            .create_reaction(dto.clone(), actor)
            .await?;

        let Some(ev) = self
            .feed_repository
            .get_feed_event_by_id(dto.feed_event_id)
            .await?
        else {
            return Ok(());
        };

        let FeedEventType::SessionCompleted(event_data) = ev.data else {
            return Ok(());
        };

        let Some(session) = self
            .session_repo
            .find_by_id_admin(event_data.session_id)
            .await?
        else {
            return Ok(());
        };

        let reaction_dto: ReadFeedReactionDto = reaction.clone().into();

        self.notification_service
            .notify_session_reaction(
                session.user_id,
                reaction.user,
                reaction_dto,
                session.id,
                session.category,
                session.start_time,
                session.end_time,
            )
            .await;

        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn remove_reaction(
        &self,
        feed_event_id: Uuid,
        emoji: String,
        actor: Actor,
    ) -> Result<()> {
        self.feed_repository
            .remove_reaction(feed_event_id, emoji, actor)
            .await
    }
    pub fn new(
        repo: FeedRepository,
        notification_service: NotificationService,
        session_repo: FixedSessionRepository,
    ) -> Self {
        Self {
            feed_repository: repo,
            notification_service,
            session_repo,
        }
    }
}
