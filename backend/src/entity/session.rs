use crate::dto::{
    category::read_category::ReadCategoryDto,
    session::{stopwatch_session::ReadStopwatchSessionDto, template::ReadTemplateShallowDto},
    tag::read_tag::ReadTagDto,
    user::read_user::ReadUserDto,
};

use super::{category::Category, tag::Tag, user::User};
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug, sqlx::Type, PartialEq)]
pub enum SessionType {
    #[serde(rename = "fixed")]
    #[sqlx(rename = "fixed")]
    FixedSession,

    #[serde(rename = "stopwatch")]
    #[sqlx(rename = "stopwatch")]
    StopwatchSession,
}

impl From<String> for SessionType {
    fn from(value: String) -> Self {
        match value.as_str() {
            "fixed" => SessionType::FixedSession,
            "stopwatch" => SessionType::StopwatchSession,
            _ => panic!("Invalid session type"),
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FixedSession {
    pub id: Uuid,

    pub category: Category,
    pub tags: Vec<Tag>,

    pub start_time: DateTime<Local>,
    pub end_time: DateTime<Local>,

    pub description: Option<String>,
    pub user_id: String,

    pub template: Option<ReadTemplateShallowDto>,
    pub project_id: Option<Uuid>,
    pub task_id: Option<Uuid>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct StopwatchSession {
    pub id: Uuid,

    pub category: Option<Category>,
    pub tags: Option<Vec<Tag>>,
    pub user: User,

    pub start_time: DateTime<Local>,
    pub description: Option<String>,
    pub project_id: Option<Uuid>,
    pub task_id: Option<Uuid>,
}

impl From<StopwatchSession> for ReadStopwatchSessionDto {
    fn from(session: StopwatchSession) -> Self {
        Self {
            id: session.id,
            session_type: SessionType::StopwatchSession,
            category: session.category.map(ReadCategoryDto::from),
            tags: session.tags.map(|tags| {
                tags.iter()
                    .map(|tag| ReadTagDto::from(tag.clone()))
                    .collect()
            }),
            description: session.description,
            start_time: session.start_time,
            user: ReadUserDto::from(session.user),
            project_id: session.project_id,
            task_id: session.task_id,
        }
    }
}
