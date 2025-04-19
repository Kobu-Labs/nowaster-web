use crate::{
    repository::statistics::sessions::{ReadColorsDto, StatisticsRepository},
    router::clerk::ClerkUser,
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

    pub async fn get_amount_of_sessions(&self, actor: ClerkUser) -> Result<u16> {
        self.repo.get_amount_of_sessions(actor).await
    }

    pub async fn get_total_session_time(&self, actor: ClerkUser) -> Result<f64> {
        self.repo.get_total_session_time(actor).await
    }

    pub async fn get_current_streak(&self, actor: ClerkUser) -> Result<u16> {
        self.repo.get_current_streak(actor).await
    }

    pub async fn get_colors(&self, actor: ClerkUser) -> Result<ReadColorsDto> {
        self.repo.get_colors(actor).await
    }
}
