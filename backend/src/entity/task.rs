use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::task::read_task::ReadTaskDto;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct Task {
    pub id: Uuid,
    pub project_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub completed: bool,
    pub user_id: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

impl From<Task> for ReadTaskDto {
    fn from(task: Task) -> Self {
        Self {
            id: task.id,
            project_id: task.project_id,
            name: task.name,
            description: task.description,
            completed: task.completed,
            created_at: task.created_at,
            updated_at: task.updated_at,
        }
    }
}
