use anyhow::Result;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::{
        feed::CreateFeedEventDto,
        session::{
            filter_session::{DateFilter, FilterSessionDto},
            fixed_session::{CreateFixedSessionDto, ReadFixedSessionDto, UpdateFixedSessionDto},
            stopwatch_session::ReadStopwatchSessionDto,
        },
    },
    entity::feed::{FeedEvent, FeedEventSource, FeedEventType, SessionEventData},
    repository::{
        fixed_session::{FixedSessionRepository, SessionRepositoryTrait},
        stopwatch_session::StopwatchSessionRepository,
    },
    router::clerk::Actor,
    service::{feed::events::FeedEventService, user_service::UserService},
};

#[derive(Clone)]
pub struct FixedSessionService {
    fixed_repo: FixedSessionRepository,
    stopwatch_repo: StopwatchSessionRepository,
    event_service: FeedEventService,
    user_service: UserService,
}

#[derive(Serialize, Deserialize)]
#[serde(untagged)]
pub enum ActiveSession {
    FixedSession(ReadFixedSessionDto),
    StopwatchSession(ReadStopwatchSessionDto),
}

impl FixedSessionService {
    pub fn new(
        repo: FixedSessionRepository,
        stopwatch_repo: StopwatchSessionRepository,
        event_service: FeedEventService,
        user_service: UserService,
    ) -> Self {
        Self {
            fixed_repo: repo,
            stopwatch_repo,
            event_service,
            user_service,
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor.user_id))]
    pub async fn create_fixed_session(
        &self,
        dto: CreateFixedSessionDto,
        actor: Actor,
    ) -> Result<ReadFixedSessionDto> {
        let res = self.fixed_repo.create(dto, actor.clone()).await?;
        let user = self
            .user_service
            .get_user_by_id(res.user_id.clone())
            .await?
            .unwrap();

        self.event_service
            .publish_event(CreateFeedEventDto {
                id: None,
                data: FeedEventType::SessionCompleted(SessionEventData {
                    session_id: res.id,
                    category: res.category.clone(),
                    tags: res.tags.clone(),
                    description: res.description.clone(),
                    start_time: res.start_time,
                    end_time: res.end_time,
                }),
                source: FeedEventSource::User(user),
            })
            .await?;

        Ok(ReadFixedSessionDto::from(res))
    }

    #[instrument(err, skip(self), fields(actor_id = %actor.user_id))]
    pub async fn filter_fixed_sessions(
        &self,
        dto: FilterSessionDto,
        actor: Actor,
    ) -> Result<Vec<ReadFixedSessionDto>> {
        let res = self.fixed_repo.filter_sessions(dto, actor).await?;
        Ok(res.into_iter().map(ReadFixedSessionDto::from).collect())
    }

    #[instrument(err, skip(self), fields(session_id = %id, actor_id = %actor.user_id))]
    pub async fn delete_session(&self, id: Uuid, actor: Actor) -> Result<()> {
        self.fixed_repo.delete_session(id, actor).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(actor_id = %actor.user_id))]
    pub async fn delete_sessions_by_filter(
        &self,
        dto: FilterSessionDto,
        actor: Actor,
    ) -> Result<u64> {
        let affected_rows = self
            .fixed_repo
            .delete_sessions_by_filter(dto, actor)
            .await?;
        Ok(affected_rows)
    }

    #[instrument(err, skip(self), fields(actor_id = %actor.user_id))]
    pub async fn get_active_sessions(&self, actor: Actor) -> Result<Vec<ActiveSession>> {
        let now = chrono::Local::now();
        let active_session_filter: FilterSessionDto = FilterSessionDto {
            from_end_time: Some(DateFilter {
                value: DateTime::from(now),
            }),

            to_start_time: Some(DateFilter {
                value: DateTime::from(now),
            }),
            ..Default::default()
        };

        let fixed_sessions = self
            .fixed_repo
            .filter_sessions(active_session_filter, actor.clone())
            .await?;

        let stopwatch_sessions = self.stopwatch_repo.read_stopwatch(actor.clone()).await?;

        let mut all_sessions: Vec<ActiveSession> = fixed_sessions
            .into_iter()
            .map(|va| ActiveSession::FixedSession(ReadFixedSessionDto::from(va)))
            .collect();

        all_sessions.extend(
            stopwatch_sessions
                .into_iter()
                .map(|va| ActiveSession::StopwatchSession(ReadStopwatchSessionDto::from(va))),
        );

        Ok(all_sessions)
    }

    #[instrument(err, skip(self), fields(session_id = %dto.id, actor_id = %actor.user_id))]
    pub async fn update_fixed_session(
        &self,
        dto: UpdateFixedSessionDto,
        actor: Actor,
    ) -> Result<ReadFixedSessionDto> {
        let res = self.fixed_repo.update_session(dto, actor).await?;

        Ok(ReadFixedSessionDto::from(res))
    }
}
