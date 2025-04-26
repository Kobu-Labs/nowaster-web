use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::category::read_category::ReadCategoryDto,
    entity::tag::{Tag, TagDetails},
};

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadTagDto {
    pub id: Uuid,
    pub label: String,
    pub color: String,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadTagDetailsDto {
    pub id: Uuid,
    pub label: String,
    #[serde(rename = "allowedCategories")]
    pub allowed_categories: Vec<ReadCategoryDto>,
    pub usages: i64,
    pub created_by: String,
    pub color: String,
}

impl ReadTagDetailsDto {
    pub fn from(entity: TagDetails) -> ReadTagDetailsDto {
        Self {
            id: entity.id,
            label: entity.label,
            created_by: entity.created_by,
            allowed_categories: entity
                .allowed_categories
                .into_iter()
                .map(ReadCategoryDto::from)
                .collect(),
            usages: entity.usages,
            color: entity.color,
        }
    }
}
