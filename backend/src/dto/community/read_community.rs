use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    entity::community::{Community, CommunityDataVisibility, CommunityVisibilityType},
    router::clerk::Actor,
};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityDto {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: CommunityVisibilityType,
    pub data_visibility: CommunityDataVisibility,
    pub owner_id: String,
    pub is_owner: bool,
    pub is_member: bool,
    pub archived_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
}

impl ReadCommunityDto {
    pub fn from_entity(community: Community, actor: &Actor, is_member: bool) -> Self {
        Self {
            id: community.id,
            name: community.name,
            description: community.description,
            avatar_url: community.avatar_url,
            visibility_type: community.visibility_type,
            data_visibility: community.data_visibility,
            is_owner: community.owner_id == actor.user_id,
            is_member,
            owner_id: community.owner_id,
            archived_at: community.archived_at,
            created_at: community.created_at,
        }
    }
}
