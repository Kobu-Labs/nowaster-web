use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateUserDto {
    pub id: String,
    pub username: Option<String>,
}
