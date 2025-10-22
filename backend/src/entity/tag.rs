use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::tag::read_tag::ReadTagDto;

use super::category::Category;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct Tag {
    pub id: Uuid,
    pub label: String,
    pub color: String,
}

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct TagDetails {
    pub id: Uuid,
    pub label: String,
    pub allowed_categories: Vec<Category>,
    pub usages: i64,
    pub created_by: String,
    pub color: String,
    pub last_used_at: DateTime<Utc>,
}

impl From<Tag> for ReadTagDto {
    fn from(tag: Tag) -> Self {
        Self {
            id: tag.id,
            label: tag.label,
            color: tag.color,
        }
    }
}
