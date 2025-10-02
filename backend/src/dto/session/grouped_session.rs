use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::session::filter::FilterSession, entity::session_template::RecurringSessionInterval,
};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum DateGrouping {
    Year,
    Month,
    Week,
    Day,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum GroupingOption {
    User,
    Tag,
    Category,
    Template,
    Date(DateGrouping),
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum AggregatingOptions {
    Count,
    SumTime,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AggregateValue {
    Count(i64),
    Duration(f64),
}

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct GroupSessionsDto {
    pub filter: FilterSession,
    pub grouping: GroupingOption,
    pub aggregating: AggregatingOptions,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserGroupedResult {
    pub user_id: String,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagGroupedResult {
    pub tag_id: Option<Uuid>,
    pub tag_label: Option<String>,
    pub tag_color: Option<String>,
    pub tag_last_used_at: Option<DateTime<Utc>>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategoryGroupedResult {
    pub category_id: Uuid,
    pub category: String,
    pub category_color: String,
    pub category_last_used_at: DateTime<Utc>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateGroupedResult {
    pub template_id: Option<Uuid>,
    pub template_name: Option<String>,
    pub template_start_date: Option<DateTime<Utc>>,
    pub template_end_date: Option<DateTime<Utc>>,
    pub template_interval: Option<RecurringSessionInterval>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DateGroupedResult {
    pub grouped_date: DateTime<Utc>,
    pub aggregate: AggregateValue,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GroupedResult {
    User(UserGroupedResult),
    Tag(TagGroupedResult),
    Category(CategoryGroupedResult),
    Template(TemplateGroupedResult),
    Date(DateGroupedResult),
}
