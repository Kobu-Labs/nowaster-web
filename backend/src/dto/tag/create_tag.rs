use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateTagDto {
    pub id: Uuid,
    pub label: String,
}

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpsertTagDto {
    pub id: Option<Uuid>,
    pub label: String,
}
