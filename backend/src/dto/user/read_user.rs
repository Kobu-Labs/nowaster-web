use serde::{Deserialize, Serialize};

use crate::entity::user::User;

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadUserDto {
    pub id: String,
    pub username: String,
    pub avatar_url: Option<String>,
}

impl ReadUserDto {
    pub fn from(entity: User) -> ReadUserDto {
        Self {
            id: entity.id,
            username: entity.username,
            avatar_url: entity.avatar_url,
        }
    }
}
