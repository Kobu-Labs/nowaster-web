use serde::{Deserialize, Serialize};

use crate::dto::user::read_user::ReadUserDto;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct User {
    pub id: String,
    pub username: String,
}

impl From<User> for ReadUserDto {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
        }
    }
}
