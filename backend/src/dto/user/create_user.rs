use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct CreateUserDto {
    pub displayname: String,
    pub clerk_user_id: String,
}
