use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct FilterTaskDto {
    pub id: Option<Uuid>,
    pub project_id: Option<Uuid>,
    pub name: Option<String>,
    pub completed: Option<bool>,
}
