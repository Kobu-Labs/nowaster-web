use crate::{
    dto::statistics::daily_activity::DailyActivity,
    repository::statistics::sessions::{ReadColorsDto, StatisticsRepository},
    router::clerk::Actor,
};
use anyhow::Result;
use chrono::{DateTime, Utc};
use tracing::instrument;

#[derive(Clone)]
pub struct StatisticsService {
    repo: StatisticsRepository,
}

impl StatisticsService {
    pub fn new(statistics_repo: StatisticsRepository) -> Self {
        Self {
            repo: statistics_repo,
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_amount_of_sessions(&self, actor: &Actor) -> Result<u16> {
        self.repo.get_amount_of_sessions(actor).await
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_total_session_time(&self, actor: &Actor) -> Result<f64> {
        self.repo.get_total_session_time(actor).await
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_current_streak(&self, actor: &Actor) -> Result<u16> {
        self.repo.get_current_streak(actor).await
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_colors(&self, actor: &Actor) -> Result<ReadColorsDto> {
        self.repo.get_colors(actor).await
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    pub async fn get_daily_activity(
        &self,
        actor: &Actor,
        timezone: Option<&str>,
        from: Option<DateTime<Utc>>,
        to: Option<DateTime<Utc>>,
    ) -> Result<Vec<DailyActivity>> {
        self.repo.get_daily_activity(actor, timezone, from, to).await
    }
}
