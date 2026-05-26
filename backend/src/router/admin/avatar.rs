use axum::{
    extract::{Path, State},
    routing::{delete, get, patch, post},
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::avatar::{
        read_avatar::{ReadAvatarPresetDto, ReadGenerationRunDto},
        write_avatar::{AdminGenerateAvatarDto, CreateAvatarPresetDto, UpdateAvatarPresetDto},
    },
    router::{admin::AdminUser, response::ApiResponse, root::AppState},
};

pub fn admin_avatar_router() -> Router<AppState> {
    Router::new()
        .route("/users/{user_id}/generate", post(regenerate_for_user_handler))
        .route("/generate", post(custom_generate_handler))
        .route(
            "/presets",
            get(list_all_presets_handler).post(create_preset_handler),
        )
        .route(
            "/presets/{preset_id}",
            patch(update_preset_handler).delete(delete_preset_handler),
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
