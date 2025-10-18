use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateUserDto {
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    pub id: String,
    #[validate(length(min = 4, message="Username must be at least 4 characters long"))]
    pub username: Option<String>,
}
