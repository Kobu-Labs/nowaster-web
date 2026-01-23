use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tracing::instrument;

use crate::router::{admin::AdminUser, response::ApiResponse, root::AppState};

#[derive(Debug, Deserialize)]
struct ResetSandboxRequest {
    secret: Option<String>,
    triggered_by: String,
    triggered_type: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SandboxLifecycleResponse {
    sandbox_lifecycle_id: i32,
    status: String,
    created_by: String,
    created_type: String,
    torndown_by: Option<String>,
    torndown_type: Option<String>,
    unique_users: i32,
    started_at: DateTime<Utc>,
    ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SandboxResetResponse {
    old: Option<SandboxLifecycleResponse>,
    new: SandboxLifecycleResponse,
}

pub fn admin_sandbox_router() -> Router<AppState> {
    Router::new()
        .route("/lifecycles", get(get_sandbox_lifecycles))
        .route("/reset", post(reset_sandbox_handler))
}

// 1. tears down the current sandbox
// 2. creates a clean slate
// 3. seeds the new data
#[instrument(skip(state))]
async fn reset_sandbox_handler(
    State(state): State<AppState>,
    admin_user: Option<AdminUser>,
    Json(req): Json<ResetSandboxRequest>,
) -> ApiResponse<SandboxResetResponse> {
    if state.config.server.app_env != crate::config::env::AppEnvironment::NowasterSandbox {
        return ApiResponse::Error {
            message: "Sandbox reset called in non-sandbox environment".to_string(),
        };
    }

    let is_admin = admin_user.is_some();
    let has_valid_secret = req.secret.as_ref().map_or(false, |secret| {
        let expected_secret =
            std::env::var("SANDBOX_RESET_SECRET").unwrap_or_else(|_| "placeholder".to_string());
        secret == &expected_secret
    });

    if !is_admin && !has_valid_secret {
        return ApiResponse::Error {
            message: "Sandbox reset attempted without valid authentication".to_string(),
        };
    }

    let old_lifecycle_data = match state.sandbox_service.get_active_lifecycle().await {
        Ok(data) => data,
        Err(e) => {
            tracing::error!("Failed to get active lifecycle: {}", e);
            return ApiResponse::Error {
                message: "Failed to get active lifecycle".to_string(),
            };
        }
    };

    if let Err(e) = state.sandbox_service.reset_sandbox().await {
        tracing::error!("Failed to reset sandbox: {}", e);
        return ApiResponse::Error {
            message: "Failed to reset sandbox".to_string(),
        };
    }

    let new_lifecycle = match state
        .sandbox_service
        .create_lifecycle(&req.triggered_by, &req.triggered_type)
        .await
    {
        Ok(lifecycle) => lifecycle,
        Err(e) => {
            tracing::error!("Failed to create lifecycle: {}", e);
            return ApiResponse::Error {
                message: "Failed to create lifecycle".to_string(),
            };
        }
    };

    if let Err(e) = state.sandbox_service.reinitialize_guest_pool().await {
        tracing::error!("Failed to reinitialize guest pool: {}", e);
        return ApiResponse::Error {
            message: "Failed to reinitialize guest pool".to_string(),
        };
    }

    if let Err(e) = state.sandbox_service.init_pool().await {
        tracing::error!("Failed to reload guest pool: {}", e);
        return ApiResponse::Error {
            message: "Failed to reload guest pool".to_string(),
        };
    }

    tracing::info!("✅ Sandbox reset complete");

    let response = SandboxResetResponse {
        old: old_lifecycle_data.map(|v| SandboxLifecycleResponse {
            sandbox_lifecycle_id: v.id,
            status: v.status,
            created_by: v.created_by,
            created_type: v.created_type,
            torndown_by: v.torndown_by,
            torndown_type: v.torndown_type,
            unique_users: v.unique_users,
            started_at: v.started_at,
            ended_at: v.ended_at,
        }),
        new: SandboxLifecycleResponse {
            sandbox_lifecycle_id: new_lifecycle.id,
            status: new_lifecycle.status,
            created_by: new_lifecycle.created_by,
            created_type: new_lifecycle.created_type,
            torndown_by: new_lifecycle.torndown_by,
            torndown_type: new_lifecycle.torndown_type,
            unique_users: new_lifecycle.unique_users,
            started_at: new_lifecycle.started_at,
            ended_at: new_lifecycle.ended_at,
        },
    };

    ApiResponse::Success { data: response }
}

#[instrument(skip(state, _admin))]
async fn get_sandbox_lifecycles(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
) -> ApiResponse<Vec<SandboxLifecycleResponse>> {
    let lifecycles = state
        .sandbox_service
        .get_all_lifecycles(100)
        .await
        .map_err(|e| {
            tracing::error!("Failed to get sandbox lifecycles: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })
        .map(|lifecycles| {
            lifecycles
                .into_iter()
                .map(|l| SandboxLifecycleResponse {
                    sandbox_lifecycle_id: l.id,
                    status: l.status,
                    created_by: l.created_by,
                    created_type: l.created_type,
                    torndown_by: l.torndown_by,
                    torndown_type: l.torndown_type,
                    unique_users: l.unique_users,
                    started_at: l.started_at,
                    ended_at: l.ended_at,
                })
                .collect::<Vec<SandboxLifecycleResponse>>()
        });

    ApiResponse::from_result(lifecycles)
}
