use super::{category::Category, tag::Tag, user::User};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FixedSession {
    pub id: Uuid,

    pub category: Category,
    pub tags: Vec<Tag>,

    pub start_time: DateTime<Local>,
    pub end_time: DateTime<Local>,

    pub description: Option<String>,
}

#[derive(Clone, Debug)]
pub struct StopwatchSession {
    pub id: Uuid,

    pub category: Category,
    pub tags: Vec<Tag>,
    pub user: User,

    pub start_time: chrono::NaiveDate,
    pub description: Option<String>,
}
