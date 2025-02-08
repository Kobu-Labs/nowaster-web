use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::{
        category::{create_category::CreateCategoryDto, read_category::ReadCategoryDto},
        tag::{create_tag::UpsertTagDto, read_tag::ReadTagDto},
    },
    entity::session::FixedSession,
};

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct CreateFixedSessionDto {
    pub category: CreateCategoryDto,
    pub tags: Vec<UpsertTagDto>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
    #[serde(rename = "endTime")]
    pub end_time: DateTime<Local>,
    pub user_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadFixedSessionDto {
    pub id: Uuid,
    pub category: ReadCategoryDto,
    pub tags: Vec<ReadTagDto>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
    #[serde(rename = "endTime")]
    pub end_time: DateTime<Local>,
    pub description: Option<String>,
}

impl ReadFixedSessionDto {
    pub fn from(entity: FixedSession) -> ReadFixedSessionDto {
        Self {
            id: entity.id,
            category: ReadCategoryDto::from(entity.category),
            tags: entity
                .tags
                .iter()
                .map(|tag| ReadTagDto::from(tag.clone()))
                .collect(),
            start_time: entity.start_time,
            end_time: entity.end_time,
            description: entity.description,
        }
    }
}
