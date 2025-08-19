use crate::{
    repository::statistics::sessions::{ReadColorsDto, StatisticsRepository},
    router::clerk::Actor,
};
use anyhow::Result;

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

    pub async fn get_amount_of_sessions(&self, actor: Actor) -> Result<u16> {
        self.repo.get_amount_of_sessions(actor).await
    }

    pub async fn get_total_session_time(&self, actor: Actor) -> Result<f64> {
        self.repo.get_total_session_time(actor).await
    }

    pub async fn get_current_streak(&self, actor: Actor) -> Result<u16> {
        self.repo.get_current_streak(actor).await
    }

    pub async fn get_colors(&self, actor: Actor) -> Result<ReadColorsDto> {
        self.repo.get_colors(actor).await
    }
}
