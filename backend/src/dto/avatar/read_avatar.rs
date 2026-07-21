use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::entity::avatar::{
    AvatarPreset, AvatarTier, GenerationRun, GenerationStatus, Hint, UserAvatar,
    UserAvatarHistory,
};

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ActivityEntryDto {
    pub label: String,
    pub hours: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadAvatarPresetDto {
    pub id: Uuid,
    pub name: String,
    #[serde(rename = "thumbnailUrl")]
    pub thumbnail_url: String,
    #[serde(rename = "referenceImageUrl")]
    pub reference_image_url: String,
    #[serde(rename = "isActive")]
    pub is_active: bool,
    #[serde(rename = "leonardoInitImageId")]
    pub leonardo_init_image_id: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
}

impl From<AvatarPreset> for ReadAvatarPresetDto {
    fn from(e: AvatarPreset) -> Self {
        Self {
            id: e.id,
            name: e.name,
            thumbnail_url: e.thumbnail_url,
            reference_image_url: e.reference_image_url,
            is_active: e.is_active,
            leonardo_init_image_id: e.leonardo_init_image_id,
            created_at: e.created_at,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadUserAvatarDto {
    pub id: Uuid,
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "basePresetId")]
    pub base_preset_id: Option<Uuid>,
    #[serde(rename = "currentImageUrl")]
    pub current_image_url: Option<String>,
    #[serde(rename = "currentThumbUrl")]
    pub current_thumb_url: Option<String>,
    pub tier: AvatarTier,
    #[serde(rename = "isEnabled")]
    pub is_enabled: bool,
    #[serde(rename = "lastGeneratedAt")]
    pub last_generated_at: Option<DateTime<Utc>>,
    #[serde(rename = "nextGenerationAt")]
    pub next_generation_at: Option<DateTime<Utc>>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

impl From<UserAvatar> for ReadUserAvatarDto {
    fn from(e: UserAvatar) -> Self {
        Self {
            id: e.id,
            user_id: e.user_id,
            base_preset_id: e.base_preset_id,
            current_image_url: e.current_image_url,
            current_thumb_url: e.current_thumb_url,
            tier: e.tier,
            is_enabled: e.is_enabled,
            last_generated_at: e.last_generated_at,
            next_generation_at: e.next_generation_at,
            updated_at: e.updated_at,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadGenerationRunDto {
    pub id: Uuid,
    #[serde(rename = "userId")]
    pub user_id: String,
    pub status: GenerationStatus,
    #[serde(rename = "startedAt")]
    pub started_at: Option<DateTime<Utc>>,
    #[serde(rename = "completedAt")]
    pub completed_at: Option<DateTime<Utc>>,
    #[serde(rename = "inputData")]
    pub input_data: Option<String>,
    #[serde(rename = "imageUrl")]
    pub image_url: Option<String>,
    #[serde(rename = "thumbUrl")]
    pub thumb_url: Option<String>,
    #[serde(rename = "errorMessage")]
    pub error_message: Option<String>,
    #[serde(rename = "retryCount")]
    pub retry_count: i32,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
}

impl From<GenerationRun> for ReadGenerationRunDto {
    fn from(e: GenerationRun) -> Self {
        Self {
            id: e.id,
            user_id: e.user_id,
            status: e.status,
            started_at: e.started_at,
            completed_at: e.completed_at,
            input_data: e.input_data,
            image_url: e.image_url,
            thumb_url: e.thumb_url,
            error_message: e.error_message,
            retry_count: e.retry_count,
            created_at: e.created_at,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadUserAvatarHistoryDto {
    pub id: Uuid,
    #[serde(rename = "userId")]
    pub user_id: String,
    #[serde(rename = "imageUrl")]
    pub image_url: String,
    #[serde(rename = "thumbUrl")]
    pub thumb_url: String,
    #[serde(rename = "generationRunId")]
    pub generation_run_id: Uuid,
    #[serde(rename = "generatedAt")]
    pub generated_at: DateTime<Utc>,
}

impl From<UserAvatarHistory> for ReadUserAvatarHistoryDto {
    fn from(e: UserAvatarHistory) -> Self {
        Self {
            id: e.id,
            user_id: e.user_id,
            image_url: e.image_url,
            thumb_url: e.thumb_url,
            generation_run_id: e.generation_run_id,
            generated_at: e.generated_at,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadHintDto {
    pub id: Uuid,
    pub label: String,
    #[serde(rename = "usageCount")]
    pub usage_count: i32,
}

impl From<Hint> for ReadHintDto {
    fn from(e: Hint) -> Self {
        Self {
            id: e.id,
            label: e.label,
            usage_count: e.usage_count,
        }
    }
}
