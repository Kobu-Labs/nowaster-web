use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::category::Category;

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadCategoryDto {
    pub id: Uuid,
    pub name: String,
    pub color: String,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadCategoryWithSessionCountDto {
    pub id: Uuid,
    pub name: String,
    pub color: String,
    #[serde(rename = "sessionCount")]
    pub session_count: i64,
}

impl ReadCategoryDto {
    pub fn from(entity: Category) -> ReadCategoryDto {
        Self {
            id: entity.id,
            name: entity.name,
            color: entity.color,
        }
    }
}
