use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CreateAvatarPresetDto {
    pub name: String,
    #[serde(rename = "thumbnailUrl")]
    pub thumbnail_url: String,
    #[serde(rename = "referenceImageUrl")]
    pub reference_image_url: String,
    #[serde(rename = "isActive")]
    pub is_active: Option<bool>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct UpdateAvatarPresetDto {
    pub name: Option<String>,
    #[serde(rename = "thumbnailUrl")]
    pub thumbnail_url: Option<String>,
    #[serde(rename = "referenceImageUrl")]
    pub reference_image_url: Option<String>,
    #[serde(rename = "isActive")]
    pub is_active: Option<bool>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SetAvatarPresetDto {
    #[serde(rename = "presetId")]
    pub preset_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CreateHintDto {
    pub label: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AssignCategoryHintDto {
    #[serde(rename = "hintId")]
    pub hint_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum AdminGenerationSource {
    #[serde(rename = "user")]
    User {
        #[serde(rename = "userId")]
        user_id: String,
    },
    #[serde(rename = "manual")]
    Manual { data: String },
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AdminGenerateAvatarDto {
    pub source: AdminGenerationSource,
    #[serde(rename = "assignToUserId")]
    pub assign_to_user_id: Option<String>,
}
