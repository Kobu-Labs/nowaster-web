use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::{
        category::read_category::ReadCategoryDto, session::template::ReadTemplateShallowDto,
        tag::read_tag::ReadTagDto,
    },
    entity::session::{FixedSession, SessionType},
};

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct AddTagDto {
    pub id: Uuid,
}

impl From<CreateFixedSessionDto> for CreateFixedSessionDtoWithId {
    fn from(dto: CreateFixedSessionDto) -> Self {
        CreateFixedSessionDtoWithId {
            id: Uuid::new_v4(),
            category_id: dto.category_id,
            tag_ids: dto.tag_ids,
            description: dto.description,
            start_time: dto.start_time,
            end_time: dto.end_time,
            template_id: dto.template_id,
            project_id: dto.project_id,
            task_id: dto.task_id,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateFixedSessionDtoWithId {
    pub id: Uuid,
    pub category_id: Uuid,
    pub tag_ids: Vec<Uuid>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
    #[serde(rename = "endTime")]
    pub end_time: DateTime<Local>,
    pub template_id: Option<Uuid>,
    #[serde(rename = "projectId")]
    pub project_id: Option<Uuid>,
    #[serde(rename = "taskId")]
    pub task_id: Option<Uuid>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateFixedSessionDto {
    pub category_id: Uuid,
    pub template_id: Option<Uuid>,
    pub tag_ids: Vec<Uuid>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
    #[serde(rename = "endTime")]
    pub end_time: DateTime<Local>,
    #[serde(rename = "projectId")]
    pub project_id: Option<Uuid>,
    #[serde(rename = "taskId")]
    pub task_id: Option<Uuid>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
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
    pub template: Option<ReadTemplateShallowDto>,
    #[serde(rename = "projectId")]
    pub project_id: Option<Uuid>,
    #[serde(rename = "taskId")]
    pub task_id: Option<Uuid>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateFixedSessionDto {
    pub id: Uuid,
    pub category_id: Option<Uuid>,
    pub tag_ids: Option<Vec<Uuid>>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: Option<DateTime<Local>>,
    #[serde(rename = "endTime")]
    pub end_time: Option<DateTime<Local>>,
    #[serde(rename = "projectId")]
    pub project_id: Option<Option<Uuid>>,
    #[serde(rename = "taskId")]
    pub task_id: Option<Option<Uuid>>,
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
            template: entity.template,
            project_id: entity.project_id,
            task_id: entity.task_id,
        }
    }
}
