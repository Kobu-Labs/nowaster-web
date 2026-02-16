use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(rename_all = "lowercase")]
pub enum SandboxStatus {
    Bare,
    Active,
    Failed,
    Recycled,
    Unknown,
}

impl From<SandboxStatus> for String {
    fn from(val: SandboxStatus) -> Self {
        match val {
            SandboxStatus::Bare => String::from("bare"),
            SandboxStatus::Active => String::from("active"),
            SandboxStatus::Failed => String::from("failed"),
            SandboxStatus::Recycled => String::from("recycled"),
            SandboxStatus::Unknown => String::from("unknown"),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SandboxLifecycle {
    pub id: uuid::Uuid,
    pub status: String,
    pub created_by: String,
    pub created_type: String,
    pub torndown_by: Option<String>,
    pub torndown_type: Option<String>,
    pub unique_users: i32,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}
