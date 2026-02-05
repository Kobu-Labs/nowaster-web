use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateProjectDto {
    pub id: uuid::Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub image_url: Option<String>,
    pub color: Option<String>,
    pub completed: Option<bool>,
}
