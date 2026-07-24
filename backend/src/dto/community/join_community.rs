use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct JoinCommunityDto {
    #[serde(default)]
    pub community_id: Uuid,
}
