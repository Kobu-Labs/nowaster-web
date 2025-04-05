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
}

impl ReadTagDto {
    pub fn from(entity: Tag) -> ReadTagDto {
        Self {
            id: entity.id,
            label: entity.label,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadTagDetailsDto {
    pub id: Uuid,
    pub label: String,
    #[serde(rename = "allowedCategories")]
    pub allowed_categories: Vec<ReadCategoryDto>,
}

impl ReadTagDetailsDto {
    pub fn from(entity: TagDetails) -> ReadTagDetailsDto {
        Self {
            id: entity.id,
            label: entity.label,
            allowed_categories: entity
                .allowed_categories
                .into_iter()
                .map(ReadCategoryDto::from)
                .collect(),
        }
    }
}
