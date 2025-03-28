use super::{category::Category, tag::Tag, user::User};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug, sqlx::Type, PartialEq)]
pub enum SessionType {
    #[serde(rename = "fixed")]
    FixedSession,
    #[serde(rename = "stopwatch")]
    StopwatchSession,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FixedSession {
    pub id: Uuid,
    pub session_type: SessionType,

    pub category: Category,
    pub tags: Vec<Tag>,

    pub start_time: DateTime<Local>,
    pub end_time: DateTime<Local>,

    pub description: Option<String>,
    pub user_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StopwatchSession {
    pub id: Uuid,
    pub session_type: SessionType,

    pub category: Option<Category>,
    pub tags: Option<Vec<Tag>>,
    pub user: Option<User>,

    pub start_time: chrono::NaiveDate,
    pub description: Option<String>,
}
