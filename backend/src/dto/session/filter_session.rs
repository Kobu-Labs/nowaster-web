use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Mode {
    #[serde(rename = "all")]
    All,
    #[serde(rename = "some")]
    Some,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LabelFilter {
    pub value: Vec<String>,
    pub mode: Mode,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdFilter {
    pub value: Vec<Uuid>,
    pub mode: Mode,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TagFilter {
    pub label: Option<LabelFilter>,
    pub id: Option<IdFilter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NameFilter {
    pub value: Vec<String>,
    pub mode: Mode,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CategoryFilter {
    pub name: Option<NameFilter>,
    pub id: Option<IdFilter>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DateFilter {
    pub value: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, Validate)]
pub struct FilterSessionDto {
    pub tags: Option<TagFilter>,
    pub categories: Option<CategoryFilter>,
    #[serde(rename = "fromStartTime")]
    pub from_start_time: Option<DateFilter>,
    #[serde(rename = "toStartTime")]
    pub to_start_time: Option<DateFilter>,
    #[serde(rename = "fromEndTime")]
    pub from_end_time: Option<DateFilter>,
    #[serde(rename = "toEndTime")]
    pub to_end_time: Option<DateFilter>,
}
