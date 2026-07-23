use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct JoinCommunityDto {
    #[serde(default)]
    pub community_id: Uuid,
    #[validate(length(min = 1, max = 12))]
    pub invite_code: Option<String>,
}
