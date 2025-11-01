use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::project::read_project::ReadProjectDto;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct Project {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub color: String,
    pub completed: bool,
    pub user_id: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

impl From<Project> for ReadProjectDto {
    fn from(project: Project) -> Self {
        Self {
            id: project.id,
            name: project.name,
            description: project.description,
            image_url: project.image_url,
            color: project.color,
            completed: project.completed,
            created_at: project.created_at,
            updated_at: project.updated_at,
        }
    }
}
