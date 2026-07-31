use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct DailyActivity {
    pub date: NaiveDate,
    pub minutes: f64,
    pub session_count: i64,
}
