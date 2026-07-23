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
