use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::entity::community::{CommunityDataVisibility, CommunityVisibilityType};

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateCommunityDto {
    #[validate(length(min = 1, max = 80))]
    pub name: String,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: CommunityVisibilityType,
    pub data_visibility: CommunityDataVisibility,
}
