use serde::{Deserialize, Serialize};
use validator::Validate;

use crate::{
    dto::session::filter_session::FilterSessionDto,
    repository::fixed_session::{AggregatingOptions, GroupingOption},
};

#[derive(Debug, Clone, Serialize, Deserialize, Validate)]
pub struct GroupSessionsDto {
    #[serde(flatten)]
    pub filter: FilterSessionDto,
    pub grouping: GroupingOption,
    pub aggregating: AggregatingOptions,
}