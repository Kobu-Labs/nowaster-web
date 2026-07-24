use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{
    dto::user::read_user::ReadUserDto,
    entity::community::{CommunityInviteStatus, CommunityInviteType, CommunityVisibilityType},
};

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateDirectInviteDto {
    #[serde(default)]
    pub community_id: Uuid,
    #[validate(length(min = 1))]
    pub invitee_username: String,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateLinkInviteDto {
    #[serde(default)]
    pub community_id: Uuid,
    pub expires_in_days: Option<i64>,
    pub max_uses: Option<i32>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct RespondToInviteDto {
    #[serde(default)]
    pub invite_id: Uuid,
    pub accept: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct JoinViaCodeDto {
    pub code: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RevokeInviteDto {
    pub community_id: Uuid,
    pub invite_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityInviteDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub community_name: String,
    pub invite_type: CommunityInviteType,
    pub status: CommunityInviteStatus,
    pub invited_user: Option<ReadUserDto>,
    pub code: Option<String>,
    pub created_by: ReadUserDto,
    pub expires_at: Option<DateTime<Local>>,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInvitePreviewDto {
    pub community_id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
    pub member_count: i64,
    pub visibility_type: CommunityVisibilityType,
}
