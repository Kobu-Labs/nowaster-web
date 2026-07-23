use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entity::community::CommunityVisibilityType;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadInviteCodeDto {
    pub code: String,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInvitePreviewDto {
    pub community_id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
    pub member_count: i64,
    pub visibility_type: CommunityVisibilityType,
}
