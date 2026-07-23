use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateTrackedCategoryDto {
    #[serde(default)]
    pub id: Uuid,
    #[validate(length(min = 1, max = 60))]
    pub name: Option<String>,
    pub color: Option<String>,
}
