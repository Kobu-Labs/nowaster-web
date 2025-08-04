use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateUserDto {
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    pub id: String,
    pub username: Option<String>,
}
