use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::dto::category::read_category::ReadCategoryDto;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateTagDto {
    pub id: Uuid,
    #[validate(length(min = 1))]
    pub label: String,
}

#[derive(Clone, Deserialize, Serialize, Validate)]
pub struct UpsertTagDto {
    pub label: String,
    #[serde(rename = "allowedCategories")]
    pub allowed_categories: Vec<ReadCategoryDto>,
}

#[derive(Clone, Deserialize, Serialize, Validate)]
pub struct UpdateTagDto {
    pub label: Option<String>,
    #[serde(rename = "allowedCategories")]
    pub allowed_categories: Option<Vec<ReadCategoryDto>>,
}
