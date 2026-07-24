use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::{dto::user::read_user::ReadUserDto, entity::community::CommunityMemberRole};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityMemberDto {
    pub id: Uuid,
    pub user: ReadUserDto,
    pub role: CommunityMemberRole,
    pub joined_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityMembersPageDto {
    pub members: Vec<ReadCommunityMemberDto>,
    pub total: i64,
}

#[derive(Clone, Deserialize, Debug)]
pub struct ListCommunityMembersParamsDto {
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateMemberRoleDto {
    #[serde(default)]
    pub community_id: Uuid,
    #[serde(default)]
    pub user_id: String,
    pub new_role: CommunityMemberRole,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RemoveMemberDto {
    pub community_id: Uuid,
    pub user_id: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityCapabilitiesDto {
    pub can_manage_members: bool,
    pub can_manage_categories: bool,
    pub can_change_roles: bool,
    pub can_delete_community: bool,
}
