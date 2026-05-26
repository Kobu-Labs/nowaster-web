use axum::{
    extract::{Path, Query, State},
    routing::{delete, get, post},
    Router,
};
use serde::Deserialize;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::avatar::{
        read_avatar::{
            ReadAvatarPresetDto, ReadGenerationRunDto, ReadHintDto, ReadUserAvatarDto,
            ReadUserAvatarHistoryDto,
        },
        write_avatar::{AssignCategoryHintDto, CreateHintDto, SetAvatarPresetDto},
    },
    router::{clerk::Actor, response::ApiResponse, root::AppState},
};

pub fn avatar_router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_avatar_handler))
        .route("/enable", post(enable_handler))
        .route("/disable", post(disable_handler))
        .route("/preset", post(set_preset_handler))
        .route("/presets", get(list_presets_handler))
        .route("/generate", post(trigger_generation_handler))
        .route("/runs", get(list_runs_handler))
        .route("/runs/latest", get(get_latest_run_handler))
        .route("/history", get(list_history_handler))
        .route("/hints", get(search_hints_handler).post(create_hint_handler))
        .route(
            "/categories/{category_id}/hints",
            get(list_category_hints_handler).post(assign_hint_handler),
        )
        .route(
            "/categories/{category_id}/hints/{hint_id}",
            delete(remove_hint_handler),
        )
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn get_avatar_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Option<ReadUserAvatarDto>> {
    ApiResponse::from_result(state.avatar_service.get_avatar(&actor.user_id).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn enable_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<ReadUserAvatarDto> {
    ApiResponse::from_result(state.avatar_service.enable(&actor.user_id).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn disable_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<ReadUserAvatarDto> {
    ApiResponse::from_result(state.avatar_service.disable(&actor.user_id).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn set_preset_handler(
    State(state): State<AppState>,
    actor: Actor,
    axum::Json(payload): axum::Json<SetAvatarPresetDto>,
) -> ApiResponse<ReadUserAvatarDto> {
    ApiResponse::from_result(
        state
            .avatar_service
            .set_preset(&actor.user_id, payload.preset_id)
            .await,
    )
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn list_presets_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadAvatarPresetDto>> {
    let _ = actor;
    ApiResponse::from_result(state.avatar_service.list_active_presets().await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn trigger_generation_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<ReadGenerationRunDto> {
    ApiResponse::from_result(state.avatar_service.trigger_generation(&actor.user_id).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn list_runs_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadGenerationRunDto>> {
    ApiResponse::from_result(state.avatar_service.list_runs(&actor.user_id).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn get_latest_run_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Option<ReadGenerationRunDto>> {
    ApiResponse::from_result(state.avatar_service.get_latest_run(&actor.user_id).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn list_history_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadUserAvatarHistoryDto>> {
    ApiResponse::from_result(
        state
            .avatar_service
            .list_avatar_history(&actor.user_id)
            .await,
    )
}

#[derive(Debug, Deserialize)]
struct HintSearchQuery {
    #[serde(default)]
    q: String,
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn search_hints_handler(
    State(state): State<AppState>,
    actor: Actor,
    Query(query): Query<HintSearchQuery>,
) -> ApiResponse<Vec<ReadHintDto>> {
    let _ = actor;
    ApiResponse::from_result(state.avatar_service.search_hints(&query.q).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id))]
async fn create_hint_handler(
    State(state): State<AppState>,
    actor: Actor,
    axum::Json(payload): axum::Json<CreateHintDto>,
) -> ApiResponse<ReadHintDto> {
    let _ = actor;
    ApiResponse::from_result(state.avatar_service.create_hint(&payload.label).await)
}

#[instrument(skip(state), fields(user_id = %actor.user_id, category_id = %category_id))]
async fn list_category_hints_handler(
    State(state): State<AppState>,
    actor: Actor,
    Path(category_id): Path<Uuid>,
) -> ApiResponse<Vec<ReadHintDto>> {
    ApiResponse::from_result(
        state
            .avatar_service
            .list_category_hints(category_id, &actor.user_id)
            .await,
    )
}

#[instrument(skip(state), fields(user_id = %actor.user_id, category_id = %category_id))]
async fn assign_hint_handler(
    State(state): State<AppState>,
    actor: Actor,
    Path(category_id): Path<Uuid>,
    axum::Json(payload): axum::Json<AssignCategoryHintDto>,
) -> ApiResponse<()> {
    ApiResponse::from_result(
        state
            .avatar_service
            .assign_category_hint(category_id, &actor.user_id, payload.hint_id)
            .await,
    )
}

#[instrument(skip(state), fields(user_id = %actor.user_id, category_id = %category_id, hint_id = %hint_id))]
async fn remove_hint_handler(
    State(state): State<AppState>,
    actor: Actor,
    Path((category_id, hint_id)): Path<(Uuid, Uuid)>,
) -> ApiResponse<()> {
    ApiResponse::from_result(
        state
            .avatar_service
            .remove_category_hint(category_id, &actor.user_id, hint_id)
            .await,
    )
}
