use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct TagFilterDto {
    pub id: Option<Uuid>,
    pub label: Option<String>,
}
