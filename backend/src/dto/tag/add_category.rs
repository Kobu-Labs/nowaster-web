use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct AddAllowedCategoryDto {
    pub category_id: Uuid,
    pub tag_id: Uuid,
}
