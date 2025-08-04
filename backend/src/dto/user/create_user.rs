use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateUserDto {
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    pub username: String,
    pub id: String,
}
