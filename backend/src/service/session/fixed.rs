use anyhow::Result;
use chrono::{DateTime, Local, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    dto::session::{
        filter_session::{DateFilter, FilterSessionDto},
        fixed_session::{CreateFixedSessionDto, ReadFixedSessionDto, UpdateFixedSessionDto},
        stopwatch_session::ReadStopwatchSessionDto,
    },
    entity::feed::{FeedEvent, FeedEventType, SessionEventData},
    repository::{
        fixed_session::{FixedSessionRepository, SessionRepositoryTrait},
        stopwatch_session::StopwatchSessionRepository,
    },
    router::clerk::ClerkUser,
    service::{category_service::CategoryService, feed_service::FeedService},
};

#[derive(Clone)]
pub struct FixedSessionService {
    fixed_repo: FixedSessionRepository,
    category_service: CategoryService,
    stopwatch_repo: StopwatchSessionRepository,
    feed_service: FeedService,
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
        cat_serv: CategoryService,
        stopwatch_repo: StopwatchSessionRepository,
        feed_service: FeedService,
    ) -> Self {
        Self {
            fixed_repo: repo,
            category_service: cat_serv,
            stopwatch_repo,
            feed_service,
        }
    }

    pub async fn create_fixed_session(
        &self,
        dto: CreateFixedSessionDto,
        actor: ClerkUser,
    ) -> Result<ReadFixedSessionDto> {
        let res = self.fixed_repo.create(dto, actor.clone()).await?;
        self.feed_service
            .publish_event(
                FeedEvent {
                    id: Uuid::new_v4(),
                    user_id: actor.user_id.clone(),
                    data: FeedEventType::SessionCompleted(SessionEventData {
                        session_id: res.id,
                        category: res.category.clone(),
                        tags: res.tags.clone(),
                        description: res.description.clone(),
                        start_time: res.start_time,
                        end_time: res.end_time,
                    }),
                    created_at: Local::now(),
                },
                actor.user_id,
            )
            .await?;

        Ok(ReadFixedSessionDto::from(res))
    }

    pub async fn filter_fixed_sessions(
        &self,
        dto: FilterSessionDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadFixedSessionDto>> {
        let res = self.fixed_repo.filter_sessions(dto, actor).await?;
        Ok(res.into_iter().map(ReadFixedSessionDto::from).collect())
    }

    pub async fn delete_session(&self, id: Uuid, actor: ClerkUser) -> Result<()> {
        self.fixed_repo.delete_session(id, actor).await?;
        Ok(())
    }

    pub async fn delete_sessions_by_filter(&self, dto: FilterSessionDto, actor: ClerkUser) -> Result<u64> {
        let affected_rows = self.fixed_repo.delete_sessions_by_filter(dto, actor).await?;
        Ok(affected_rows)
    }

    pub async fn get_active_sessions(&self, actor: ClerkUser) -> Result<Vec<ActiveSession>> {
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

    pub async fn update_fixed_session(
        &self,
        dto: UpdateFixedSessionDto,
        actor: ClerkUser,
    ) -> Result<ReadFixedSessionDto> {
        let res = self.fixed_repo.update_session(dto, actor).await?;

        Ok(ReadFixedSessionDto::from(res))
    }
}
