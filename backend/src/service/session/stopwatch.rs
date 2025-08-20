use crate::{
    dto::session::stopwatch_session::{
        CreateStopwatchSessionDto, ReadStopwatchSessionDto, UpdateStopwatchSessionDto,
    },
    repository::stopwatch_session::StopwatchSessionRepository,
    router::clerk::Actor,
    service::category_service::CategoryService,
};
use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

#[derive(Clone)]
pub struct StopwatchSessionService {
    category_service: CategoryService,
    stopwatch_repo: StopwatchSessionRepository,
}

impl StopwatchSessionService {
    pub fn new(
        category_service: CategoryService,
        stopwatch_repo: StopwatchSessionRepository,
    ) -> Self {
        Self {
            category_service,
            stopwatch_repo,
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor.user_id))]
    pub async fn create_stopwatch_session(
        &self,
        dto: CreateStopwatchSessionDto,
        actor: Actor,
    ) -> Result<ReadStopwatchSessionDto> {
        let category = match dto.clone().category {
            Some(cat) => {
                let a = self
                    .category_service
                    .upsert_category(cat, actor.clone())
                    .await?;
                Some(a)
            }
            None => None,
        };

        let tag_ids: Option<Vec<Uuid>> = dto
            .clone()
            .tags
            .map(|t| t.into_iter().map(|t| t.id).collect());

        let res = self
            .stopwatch_repo
            .create(dto.clone(), category.map(|c| c.id), tag_ids, actor)
            .await?;

        Ok(ReadStopwatchSessionDto::from(res))
    }

    #[instrument(err, skip(self), fields(session_id = %session_id, actor_id = %actor.user_id))]
    pub async fn delete_stopwatch_session(&self, session_id: Uuid, actor: Actor) -> Result<()> {
        self.stopwatch_repo.delete_session(session_id, actor).await
    }

    #[instrument(err, skip(self), fields(actor_id = %actor.user_id))]
    pub async fn read_stopwatch_session(
        &self,
        actor: Actor,
    ) -> Result<Option<ReadStopwatchSessionDto>> {
        let res = self.stopwatch_repo.read_stopwatch(actor).await?;

        Ok(res.map(ReadStopwatchSessionDto::from))
    }

    #[instrument(err, skip(self), fields(session_id = %dto.id, actor_id = %actor.user_id))]
    pub async fn update_stopwatch_session(
        &self,
        dto: UpdateStopwatchSessionDto,
        actor: Actor,
    ) -> Result<ReadStopwatchSessionDto> {
        let res = self
            .stopwatch_repo
            .update_session(dto.clone(), actor)
            .await?;

        Ok(ReadStopwatchSessionDto::from(res))
    }
}
