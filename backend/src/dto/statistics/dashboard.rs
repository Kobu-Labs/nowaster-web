use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct DashboardData {
    pub streak: u16,
    pub minutes: f64,
    pub session_count: u16,
}
