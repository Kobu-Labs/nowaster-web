use serde::{Deserialize, Serialize};

use crate::{entity::user::User, entity::visibility::VisibilityFlags};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadUserDto {
    pub id: String,
    pub username: String,
    pub avatar_thumb_url: Option<String>,
    pub avatar_image_url: Option<String>,
    pub visibility_flags: VisibilityFlags,
}

impl ReadUserDto {
    pub fn from(entity: User) -> ReadUserDto {
        Self {
            id: entity.id,
            username: entity.username,
            avatar_thumb_url: entity.avatar_thumb_url,
            avatar_image_url: entity.avatar_image_url,
            visibility_flags: entity.visibility_flags,
        }
    }
}
