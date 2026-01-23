use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SandboxLifecycle {
    pub id: i32,
    pub status: String,
    pub created_by: String,
    pub created_type: String,
    pub torndown_by: Option<String>,
    pub torndown_type: Option<String>,
    pub unique_users: i32,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}

impl SandboxLifecycle {
    pub fn duration_hours(&self) -> Option<f64> {
        self.ended_at.map(|ended| {
            let duration = ended - self.started_at;
            duration.num_seconds() as f64 / 3600.0
        })
    }
}
