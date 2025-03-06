use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::tag::Tag;

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
