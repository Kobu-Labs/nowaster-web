use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityTrackedCategory {
    pub id: Uuid,
    pub community_id: Uuid,
    pub name: String,
    pub color: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityCategoryMapping {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Uuid,
    pub user_id: String,
    pub personal_category_id: Uuid,
    pub created_at: DateTime<Local>,
}
