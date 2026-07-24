use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::Type;
use uuid::Uuid;

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq)]
#[sqlx(type_name = "community_visibility_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityVisibilityType {
    Public,
    InviteOnly,
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq)]
#[sqlx(type_name = "community_data_visibility", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityDataVisibility {
    Public,
    MembersOnly,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Community {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: CommunityVisibilityType,
    pub data_visibility: CommunityDataVisibility,
    pub owner_id: String,
    pub archived_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

impl Community {
    pub fn is_archived(&self) -> bool {
        self.archived_at.is_some()
    }
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq, PartialOrd, Ord)]
#[sqlx(type_name = "community_member_role", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityMemberRole {
    Member,
    Manager,
    Owner,
}

impl CommunityMemberRole {
    pub fn can_manage_members(&self) -> bool {
        *self >= Self::Manager
    }

    pub fn can_manage_categories(&self) -> bool {
        *self >= Self::Manager
    }

    pub fn can_change_roles(&self) -> bool {
        *self == Self::Owner
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityMember {
    pub id: Uuid,
    pub community_id: Uuid,
    pub user_id: String,
    pub role: CommunityMemberRole,
    pub joined_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInviteCode {
    pub id: Uuid,
    pub community_id: Uuid,
    pub code: String,
    pub created_by: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}
