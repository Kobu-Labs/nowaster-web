use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct MigrateTagDto {
    pub from_tag_id: Uuid,
    pub target_tag_id: Option<Uuid>, // None means remove the tag
    
    #[serde(default)]
    pub filters: TagMigrationFilters,
}

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct TagMigrationPreviewDto {
    pub from_tag_id: Uuid,
    pub target_tag_id: Option<Uuid>,
    
    #[serde(default)]
    pub filters: TagMigrationFilters,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TagMigrationFilters {
    pub category_ids: Option<Vec<Uuid>>, // Sessions must have at least one of these categories
    pub from_start_time: Option<DateTime<Local>>,
    pub to_end_time: Option<DateTime<Local>>,
}

// Reuse the same preview response types from category migration
pub use super::super::category::migrate_category::{MigrationPreviewResponse, SessionPreview};