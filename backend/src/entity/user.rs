use serde::{Deserialize, Serialize};

use crate::{dto::user::read_user::ReadUserDto, entity::visibility::VisibilityFlags};

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct User {
    pub id: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub visibility_flags: VisibilityFlags,
}

impl From<User> for ReadUserDto {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            visibility_flags: user.visibility_flags,
        }
    }
}
