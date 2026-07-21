use axum::{
    extract::{Multipart, Path, Query, State},
    routing::{delete, get, patch, post},
    Router,
};
use serde::Deserialize;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::avatar::{
        read_avatar::{ActivityEntryDto, ReadAvatarPresetDto, ReadGenerationRunDto},
        write_avatar::{AdminGenerateAvatarDto, CreateAvatarPresetDto, UpdateAvatarPresetDto},
    },
    router::{admin::AdminUser, response::ApiResponse, root::AppState},
};

pub fn admin_avatar_router() -> Router<AppState> {
    Router::new()
        .route("/users/{user_id}/generate", post(regenerate_for_user_handler))
        .route("/generate", post(custom_generate_handler))
        .route("/playground", post(playground_generate_handler))
        .route("/playground/{user_id}/data", get(playground_data_handler))
        .route("/runs", get(list_recent_runs_handler))
        .route(
            "/presets",
            get(list_all_presets_handler).post(create_preset_handler),
        )
        .route("/presets/upload-bulk", post(bulk_upload_presets_handler))
        .route(
            "/presets/{preset_id}",
            patch(update_preset_handler).delete(delete_preset_handler),
        )
        .route(
            "/presets/{preset_id}/upload-to-leonardo",
            post(upload_preset_to_leonardo_handler),
        )
}

#[derive(Deserialize, Debug)]
struct PlaygroundGenerateRequest {
    #[serde(rename = "userId")]
    user_id: String,
}

#[derive(Deserialize, Debug)]
struct ListRunsQuery {
    limit: Option<i64>,
}

#[derive(Deserialize, Debug)]
struct PlaygroundDataQuery {
    weeks: Option<i64>,
}

#[instrument(skip(state))]
async fn playground_generate_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    axum::Json(payload): axum::Json<PlaygroundGenerateRequest>,
) -> ApiResponse<ReadGenerationRunDto> {
    ApiResponse::from_result(
        state
            .avatar_service
            .admin_playground_generate(&payload.user_id)
            .await,
    )
}

#[instrument(skip(state))]
async fn list_recent_runs_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Query(q): Query<ListRunsQuery>,
) -> ApiResponse<Vec<ReadGenerationRunDto>> {
    ApiResponse::from_result(
        state
            .avatar_service
            .admin_list_recent_runs(q.limit.unwrap_or(50))
            .await,
    )
}

#[instrument(skip(state), fields(user_id = %user_id))]
async fn playground_data_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(user_id): Path<String>,
    Query(q): Query<PlaygroundDataQuery>,
) -> ApiResponse<Vec<ActivityEntryDto>> {
    ApiResponse::from_result(
        state
            .avatar_service
            .admin_get_playground_data(&user_id, q.weeks.unwrap_or(13))
            .await,
    )
}

#[instrument(skip(state), fields(target_user_id = %user_id))]
async fn regenerate_for_user_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(user_id): Path<String>,
) -> ApiResponse<ReadGenerationRunDto> {
    ApiResponse::from_result(state.avatar_service.admin_trigger_generation(&user_id).await)
}

#[instrument(skip(state))]
async fn custom_generate_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    axum::Json(payload): axum::Json<AdminGenerateAvatarDto>,
) -> ApiResponse<ReadGenerationRunDto> {
    ApiResponse::from_result(
        state
            .avatar_service
            .admin_generate(payload.source, payload.assign_to_user_id.as_deref())
            .await,
    )
}

#[instrument(skip(state))]
async fn list_all_presets_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
) -> ApiResponse<Vec<ReadAvatarPresetDto>> {
    ApiResponse::from_result(state.avatar_service.admin_list_all_presets().await)
}

#[instrument(skip(state))]
async fn create_preset_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    axum::Json(payload): axum::Json<CreateAvatarPresetDto>,
) -> ApiResponse<ReadAvatarPresetDto> {
    ApiResponse::from_result(state.avatar_service.admin_create_preset(payload).await)
}

#[instrument(skip(state), fields(preset_id = %preset_id))]
async fn update_preset_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(preset_id): Path<Uuid>,
    axum::Json(payload): axum::Json<UpdateAvatarPresetDto>,
) -> ApiResponse<ReadAvatarPresetDto> {
    ApiResponse::from_result(
        state
            .avatar_service
            .admin_update_preset(preset_id, payload)
            .await,
    )
}

#[instrument(skip(state), fields(preset_id = %preset_id))]
async fn delete_preset_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(preset_id): Path<Uuid>,
) -> ApiResponse<()> {
    ApiResponse::from_result(state.avatar_service.admin_delete_preset(preset_id).await)
}

#[instrument(skip(state), fields(preset_id = %preset_id))]
async fn upload_preset_to_leonardo_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Path(preset_id): Path<Uuid>,
) -> ApiResponse<ReadAvatarPresetDto> {
    ApiResponse::from_result(
        state
            .avatar_service
            .admin_upload_preset_to_leonardo(preset_id)
            .await,
    )
}

#[instrument(skip(state, multipart))]
async fn bulk_upload_presets_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    mut multipart: Multipart,
) -> ApiResponse<Vec<ReadAvatarPresetDto>> {
    let result: anyhow::Result<_> = async {
        let mut images: Vec<(String, Vec<u8>, String)> = Vec::new();

        while let Some(field) = multipart
            .next_field()
            .await
            .map_err(|e| anyhow::anyhow!("Multipart error: {}", e))?
        {
            let file_name = field.file_name().unwrap_or("image.jpg").to_string();
            let preset_name = std::path::Path::new(&file_name)
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or(&file_name)
                .to_string();
            let raw_ext = std::path::Path::new(&file_name)
                .extension()
                .and_then(|s| s.to_str())
                .unwrap_or("jpg")
                .to_lowercase();
            let extension =
                if ["jpg", "jpeg", "png", "webp"].contains(&raw_ext.as_str()) {
                    raw_ext
                } else {
                    "jpg".to_string()
                };
            let data = field
                .bytes()
                .await
                .map_err(|e| anyhow::anyhow!("Failed to read field bytes: {}", e))?
                .to_vec();
            if data.is_empty() {
                continue;
            }
            images.push((preset_name, data, extension));
        }

        state.avatar_service.admin_bulk_upload_presets(images).await
    }
    .await;

    ApiResponse::from_result(result)
}
