use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::dto::category::read_category::ReadCategoryDto;

#[derive(Clone, Deserialize, Serialize, Validate)]
pub struct CreateTagDto {
    pub label: String,
    #[serde(rename = "allowedCategories")]
    pub allowed_categories: Vec<ReadCategoryDto>,
    pub color: String,
}

#[derive(Clone, Deserialize, Serialize, Validate)]
pub struct UpdateTagDto {
    pub label: Option<String>,
    #[serde(rename = "allowedCategories")]
    pub allowed_categories: Option<Vec<ReadCategoryDto>>,
    pub color: Option<String>,
}
