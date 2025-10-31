use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::project::Project;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ReadProjectDto {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub color: String,
    pub completed: bool,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ReadProjectDetailsDto {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub color: String,
    pub completed: bool,
    #[serde(rename = "taskCount")]
    pub task_count: i64,
    #[serde(rename = "completedTaskCount")]
    pub completed_task_count: i64,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ProjectStatsDto {
    pub total_projects: i64,
    pub active_projects: i64,
    pub completed_projects: i64,
    pub total_tasks: i64,
    pub total_sessions: i64,
    pub total_time_minutes: Option<f64>,
}

impl ReadProjectDto {
    pub fn from(entity: Project) -> ReadProjectDto {
        Self {
            id: entity.id,
            name: entity.name,
            description: entity.description,
            image_url: entity.image_url,
            color: entity.color,
            completed: entity.completed,
            created_at: entity.created_at,
            updated_at: entity.updated_at,
        }
    }
}
