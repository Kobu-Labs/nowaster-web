use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::{
    category::read_category::ReadCategoryDto,
    community_category::read_tracked_category::ReadTrackedCategoryDto,
};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCategoryMappingDto {
    pub id: Uuid,
    pub tracked_category: ReadTrackedCategoryDto,
    pub personal_category: ReadCategoryDto,
    pub created_at: DateTime<Local>,
}
