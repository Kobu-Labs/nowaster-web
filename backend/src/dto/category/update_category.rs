use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateCategoryDto {
    pub id: uuid::Uuid,
    pub name: Option<String>,
    pub color: Option<String>,
}
