use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::{category::Category, tag::Tag};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum ExistingSessionsAction {
    #[serde(rename = "keep-all")]
    KeepAll,
    #[serde(rename = "delete-all")]
    DeleteAll,
    #[serde(rename = "delete-future")]
    DeleteFuture,
}

#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "recurring_session_interval", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum RecurringSessionInterval {
    Monthly,
    #[serde(rename = "bi-weekly")]
    BiWeekly,
    Weekly,
    Daily,
}

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct SessionTemplate {
    pub id: Uuid,
    pub user_id: String,
    pub created_at: DateTime<Local>,

    pub name: String,
    pub interval: RecurringSessionInterval,
    pub start_date: DateTime<Local>,
    pub end_date: DateTime<Local>,

    pub recurring_sessions: Vec<RecurringSession>,
}

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct RecurringSession {
    pub id: Uuid,

    pub category: Category,
    pub tags: Vec<Tag>,

    pub start_minute_offset: f64,
    pub end_minute_offset: f64,

    pub description: Option<String>,
}
