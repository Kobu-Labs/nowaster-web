use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateTaskDto {
    pub project_id: Uuid,
    #[validate(length(min = 1))]
    pub name: String,
    pub description: Option<String>,
}
