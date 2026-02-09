use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateProjectDto {
    #[validate(length(min = 1))]
    pub name: String,
    pub description: Option<String>,
    pub image_url: Option<String>,
    #[validate(length(min = 1))]
    pub color: String,
}
