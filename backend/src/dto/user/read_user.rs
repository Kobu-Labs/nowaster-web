use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entity::user::User;

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadUserDto {
    id: Uuid,
    username: String,
}

impl ReadUserDto {
    pub fn from(entity: User) -> ReadUserDto {
        Self {
            id: entity.id,
            username: entity.username,
        }
    }
}
