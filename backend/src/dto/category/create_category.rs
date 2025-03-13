use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateCategoryDto {
    #[validate(length(min = 1))]
    pub name: String,
    #[validate(length(min = 1))]
    pub color: String,
}
