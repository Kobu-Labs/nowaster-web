use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Default, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum DiscoverySort {
    #[default]
    Members,
    Activity,
    Newest,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DiscoverCommunitiesDto {
    #[serde(default)]
    pub query: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub sort: DiscoverySort,
    #[serde(default)]
    pub limit: Option<i64>,
    #[serde(default)]
    pub offset: Option<i64>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunitySearchResultDto {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub member_count: i32,
    pub recent_activity_minutes: i64,
    pub is_member: bool,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DiscoverCommunitiesResultDto {
    pub results: Vec<CommunitySearchResultDto>,
    pub total_count: i64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CategoryAutocompleteDto {
    pub prefix: String,
}
