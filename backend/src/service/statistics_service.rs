use crate::repository::statistics::sessions::StatisticsRepository;
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

    pub async fn get_amount_of_sessions(&self) -> Result<u16> {
        self.repo.get_amount_of_sessions().await
    }

    pub async fn get_total_session_time(&self) -> Result<f64> {
        self.repo.get_total_session_time().await
    }

    pub async fn get_current_streak(&self) -> Result<u16> {
        self.repo.get_current_streak().await
    }
}
