use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::community::{CommunityDataVisibility, CommunityVisibilityType};

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateCommunityDto {
    pub id: Uuid,
    #[validate(length(min = 1, max = 80))]
    pub name: Option<String>,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: Option<CommunityVisibilityType>,
    pub data_visibility: Option<CommunityDataVisibility>,
}
