use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UserRegisterDto {
    pub username: String,
    pub password: String,
}
