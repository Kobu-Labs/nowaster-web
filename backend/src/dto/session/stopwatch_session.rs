use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::{
    dto::{
        category::{create_category::CreateCategoryDto, read_category::ReadCategoryDto},
        tag::read_tag::ReadTagDto,
    },
    service::friend_service::ReadUserAvatarDto,
};

use super::fixed_session::AddTagDto;

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct CreateStopwatchSessionDto {
    pub category: Option<CreateCategoryDto>,
    pub tags: Option<Vec<AddTagDto>>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ReadStopwatchSessionDto {
    pub category: Option<ReadCategoryDto>,
    pub tags: Option<Vec<ReadTagDto>>,
    pub description: Option<String>,
    #[serde(rename = "startTime")]
    pub start_time: DateTime<Local>,
    pub user: ReadUserAvatarDto,
}
