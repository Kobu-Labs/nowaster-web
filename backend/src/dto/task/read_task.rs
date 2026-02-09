use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::task::Task;
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ReadTaskDetailsDto {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub completed: bool,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,

    #[serde(rename = "sessionCount")]
    pub session_count: i64,

    #[serde(rename = "totalTimeMinutes")]
    pub total_time_minutes: f64,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ReadTaskDto {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub completed: bool,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct TaskStatsDto {
    pub total_tasks: i64,
    pub active_tasks: i64,
    pub completed_tasks: i64,
    pub total_sessions: i64,
    pub total_time_minutes: Option<f64>,
}

impl ReadTaskDto {
    pub fn from(entity: Task) -> ReadTaskDto {
        Self {
            id: entity.id,
            project_id: entity.project_id,
            name: entity.name,
            description: entity.description,
            completed: entity.completed,
            created_at: entity.created_at,
            updated_at: entity.updated_at,
        }
    }
}
