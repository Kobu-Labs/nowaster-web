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
    pub member_count: i32,
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

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq)]
#[sqlx(type_name = "community_invite_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum CommunityInviteType {
    Direct,
    Link,
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq)]
#[sqlx(type_name = "community_invite_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum CommunityInviteStatus {
    Pending,
    Accepted,
    Declined,
    Revoked,
    Expired,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInvite {
    pub id: Uuid,
    pub community_id: Uuid,
    pub invite_type: CommunityInviteType,
    pub status: CommunityInviteStatus,
    pub invited_user_id: Option<String>,
    pub code: Option<String>,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub created_by: String,
    pub expires_at: Option<DateTime<Local>>,
    pub responded_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
}

impl CommunityInvite {
    pub fn is_expired(&self) -> bool {
        self.expires_at
            .is_some_and(|expires_at| expires_at < Local::now())
    }
}
