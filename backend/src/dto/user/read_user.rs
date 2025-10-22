use serde::{Deserialize, Serialize};

use crate::{entity::user::User, entity::visibility::VisibilityFlags};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadUserDto {
    pub id: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub visibility_flags: VisibilityFlags,
}

impl ReadUserDto {
    pub fn from(entity: User) -> ReadUserDto {
        Self {
            id: entity.id,
            username: entity.username,
            avatar_url: entity.avatar_url,
            visibility_flags: entity.visibility_flags,
        }
    }
}
