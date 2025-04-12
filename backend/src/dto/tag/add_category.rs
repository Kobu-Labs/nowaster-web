use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct AddAllowedCategoryDto {
    #[serde(rename = "categoryId")]
    pub category_id: Uuid,
    #[serde(rename = "tagId")]
    pub tag_id: Uuid,
}
