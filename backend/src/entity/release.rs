use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReleaseUser {
    pub id: String,
    pub username: String,
    pub avatar_url: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Release {
    pub id: Uuid,
    pub version: String,
    pub name: String,
    pub short_description: Option<String>,
    pub released: bool,
    pub released_at: Option<DateTime<Local>>,
    pub released_by: Option<ReleaseUser>,
    pub tags: Vec<String>,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_keywords: Option<String>,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SeenRelease {
    pub release_id: Uuid,
    pub user_id: String,
    pub seen_at: DateTime<Local>,
}
