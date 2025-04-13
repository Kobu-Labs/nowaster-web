use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::{
        category::{create_category::CreateCategoryDto, read_category::ReadCategoryDto},
        tag::read_tag::ReadTagDto,
    },
    entity::session::{FixedSession, SessionType},
};

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct AddTagDto {
    pub id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct CreateFixedSessionDto {
    pub category: CreateCategoryDto,
    pub tags: Vec<AddTagDto>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
    #[serde(rename = "endTime")]
    pub end_time: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadFixedSessionDto {
    pub id: Uuid,
    pub category: ReadCategoryDto,
    pub session_type: SessionType,
    pub tags: Vec<ReadTagDto>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
    #[serde(rename = "endTime")]
    pub end_time: DateTime<Local>,
    pub description: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct UpdateFixedSessionDto {
    pub id: Uuid,
    pub category_id: Option<Uuid>,
    pub tag_ids: Option<Vec<Uuid>>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: Option<DateTime<Local>>,
    #[serde(rename = "endTime")]
    pub end_time: Option<DateTime<Local>>,
}

impl ReadFixedSessionDto {
    pub fn from(entity: FixedSession) -> ReadFixedSessionDto {
        Self {
            id: entity.id,
            category: ReadCategoryDto::from(entity.category),
            session_type: SessionType::FixedSession,
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
