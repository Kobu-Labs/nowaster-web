use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct MigrateCategoryDto {
    pub from_category_id: Uuid,
    pub target_category_id: Uuid,
    
    #[serde(default)]
    pub filters: MigrationFilters,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct MigrationPreviewDto {
    pub from_category_id: Uuid,
    pub target_category_id: Option<Uuid>,
    
    #[serde(default)]
    pub filters: MigrationFilters,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct MigrationFilters {
    pub tag_ids: Option<Vec<Uuid>>,
    pub from_start_time: Option<DateTime<Local>>,
    pub to_end_time: Option<DateTime<Local>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MigrationPreviewResponse {
    pub affected_sessions_count: i64,
    pub session_previews: Vec<SessionPreview>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SessionPreview {
    pub id: Uuid,
    pub description: Option<String>,
    pub start_time: DateTime<Local>,
    pub end_time: Option<DateTime<Local>>,
    pub current_category_name: String,
    pub current_tag_names: String, // Will be comma-separated string from SQL
}