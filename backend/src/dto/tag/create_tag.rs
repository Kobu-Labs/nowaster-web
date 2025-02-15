use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateTagDto {
    pub id: Uuid,
    #[validate(length(min = 1))]
    pub label: String,
}

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpsertTagDto {
    pub id: Option<Uuid>,
    #[validate(length(min = 1))]
    pub label: String,
}
