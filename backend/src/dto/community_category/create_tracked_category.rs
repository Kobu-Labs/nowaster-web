use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateTrackedCategoryDto {
    #[validate(length(min = 1, max = 60))]
    pub name: String,
    #[validate(length(min = 1))]
    pub color: String,
}
