use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::session_template::RecurringSessionInterval;

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct CreateSessionTemplateDto {
    pub name: String,
    pub start_date: DateTime<Local>,
    pub end_date: DateTime<Local>,
    pub interval: RecurringSessionInterval,
    pub sessions: Vec<CreateRecurringSessionDto>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct CreateRecurringSessionDto {
    pub category_id: Uuid,
    pub tag_ids: Vec<Uuid>,
    pub description: Option<String>,
    pub start_minute_offset: f64,
    pub end_minute_offset: f64,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct UpdateSessionTemplateDto {
    pub id: Uuid,
    pub name: String,
    pub start_date: DateTime<Local>,
    pub end_date: DateTime<Local>,
    pub interval: RecurringSessionInterval,
    pub sessions: Vec<CreateRecurringSessionDto>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct DeleteRecurringSessionDto {
    pub id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct DelteteSessionTemplateDto {
    pub id: Uuid,
}
