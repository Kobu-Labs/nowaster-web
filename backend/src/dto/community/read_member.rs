use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{dto::user::read_user::ReadUserDto, entity::community::CommunityMemberRole};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityMemberDto {
    pub id: Uuid,
    pub user: ReadUserDto,
    pub role: CommunityMemberRole,
    pub joined_at: DateTime<Local>,
}
