use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadTrackedCategoryDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub name: String,
    pub color: String,
    pub mapped_member_count: i64,
}
