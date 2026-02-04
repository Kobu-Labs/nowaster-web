use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::entity::release::{Release, ReleaseUser};

// Read DTOs
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReadReleaseDto {
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
pub struct ReadPublicReleaseDto {
    pub version: String,
    pub name: String,
    pub short_description: Option<String>,
    pub released_at: DateTime<Local>,
    pub released_by: Option<ReleaseUser>,
    pub tags: Vec<String>,
}

// Create/Update DTOs
#[derive(Clone, Debug, Serialize, Deserialize, Validate)]
pub struct CreateReleaseDto {
    #[validate(length(min = 1, max = 50, message = "Version must be 1-50 characters"))]
    pub version: String,

    #[validate(length(min = 1, max = 255, message = "Name must be 1-255 characters"))]
    pub name: String,

    pub short_description: Option<String>,

    #[validate(length(max = 10, message = "Maximum 10 tags allowed"))]
    pub tags: Vec<String>,

    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_keywords: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize, Validate)]
pub struct UpdateReleaseDto {
    pub version: Option<String>,
    pub name: Option<String>,
    pub short_description: Option<String>,
    pub tags: Option<Vec<String>>,
    pub seo_title: Option<String>,
    pub seo_description: Option<String>,
    pub seo_keywords: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PublishReleaseDto {
    pub release_id: Uuid,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MarkReleaseSeenDto {
    pub release_id: Uuid,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReleaseListQueryDto {
    pub released_only: Option<bool>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LatestUnseenReleaseDto {
    pub release: ReadPublicReleaseDto,
    pub unseen: bool,
}

// Conversions
impl From<Release> for ReadReleaseDto {
    fn from(release: Release) -> Self {
        Self {
            id: release.id,
            version: release.version,
            name: release.name,
            short_description: release.short_description,
            released: release.released,
            released_at: release.released_at,
            released_by: release.released_by,
            tags: release.tags,
            seo_title: release.seo_title,
            seo_description: release.seo_description,
            seo_keywords: release.seo_keywords,
            created_at: release.created_at,
            updated_at: release.updated_at,
        }
    }
}

impl From<Release> for ReadPublicReleaseDto {
    fn from(release: Release) -> Self {
        Self {
            version: release.version,
            name: release.name,
            short_description: release.short_description,
            released_at: release.released_at.unwrap_or_else(chrono::Local::now),
            released_by: release.released_by,
            tags: release.tags,
        }
    }
}
