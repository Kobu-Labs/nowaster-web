use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateUserDto {
    pub username: String,
    pub id: String,
}
