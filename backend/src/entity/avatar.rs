use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "avatar_tier")]
#[serde(rename_all = "lowercase")]
pub enum AvatarTier {
    #[sqlx(rename = "free")]
    Free,
    #[sqlx(rename = "paid")]
    Paid,
}

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "generation_status")]
#[serde(rename_all = "lowercase")]
pub enum GenerationStatus {
    #[sqlx(rename = "pending")]
    Pending,
    #[sqlx(rename = "running")]
    Running,
    #[sqlx(rename = "success")]
    Success,
    #[sqlx(rename = "failed")]
    Failed,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AvatarPreset {
    pub id: Uuid,
    pub name: String,
    pub thumbnail_url: String,
    pub reference_image_url: String,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct UserAvatar {
    pub id: Uuid,
    pub user_id: String,
    pub base_preset_id: Option<Uuid>,
    pub current_image_url: Option<String>,
    pub current_thumb_url: Option<String>,
    pub tier: AvatarTier,
    pub is_enabled: bool,
    pub last_generated_at: Option<DateTime<Utc>>,
    pub next_generation_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct GenerationRun {
    pub id: Uuid,
    pub user_id: String,
    pub status: GenerationStatus,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub input_data: Option<String>,
    pub image_url: Option<String>,
    pub thumb_url: Option<String>,
    pub error_message: Option<String>,
    pub retry_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct UserAvatarHistory {
    pub id: Uuid,
    pub user_id: String,
    pub image_url: String,
    pub thumb_url: String,
    pub generation_run_id: Uuid,
    pub generated_at: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Hint {
    pub id: Uuid,
    pub label: String,
    pub usage_count: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CategoryHint {
    pub id: Uuid,
    pub category_id: Uuid,
    pub user_id: String,
    pub hint_id: Uuid,
    pub created_at: DateTime<Utc>,
}
