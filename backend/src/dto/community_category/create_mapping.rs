use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateCategoryMappingDto {
    pub tracked_category_id: Uuid,
    pub personal_category_id: Uuid,
}
