use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::category::Category;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ReadCategoryDto {
    pub id: Uuid,
    pub name: String,
    pub color: String,
    pub last_used_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ReadCategoryWithSessionCountDto {
    pub id: Uuid,
    pub name: String,
    pub color: String,
    #[serde(rename = "sessionCount")]
    pub session_count: i64,
    pub last_used_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CategoryStatsDto {
    pub total_categories: i64,
    pub total_sessions: i64,
    pub total_time_minutes: Option<f64>,
    pub average_sessions_per_category: f64,
    pub most_used_category: Option<ReadCategoryDto>,
}

impl ReadCategoryDto {
    pub fn from(entity: Category) -> ReadCategoryDto {
        Self {
            id: entity.id,
            name: entity.name,
            color: entity.color,
            last_used_at: entity.last_used_at,
        }
    }
}
