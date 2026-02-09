use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateTaskDto {
    pub id: uuid::Uuid,
    pub name: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
}
