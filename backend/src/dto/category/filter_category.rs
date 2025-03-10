use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, Validate)]
pub struct FilterCategoryDto {
    pub id: Option<Uuid>,
    pub name: Option<String>,
}
