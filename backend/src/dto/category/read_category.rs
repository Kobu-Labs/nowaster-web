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

impl ReadCategoryDto {
    pub fn from(entity: Category) -> ReadCategoryDto {
        Self {
            id: entity.id,
            name: entity.name,
            color: entity.color,
        }
    }
}
