use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use tracing::instrument;

use crate::router::{admin::AdminUser, response::ApiResponse, root::AppState};

#[derive(Debug, Deserialize)]
struct GetLifecyclesRequest {
    secret: String,
}

#[derive(Debug, Deserialize)]
struct ProxyResetRequest {
    #[serde(rename = "triggeredBy")]
    triggered_by: String,
    #[serde(rename = "triggeredType")]
    triggered_type: String,
}

#[derive(Debug, Deserialize)]
struct ResetSandboxRequest {
    secret: Option<String>,
    #[serde(rename = "triggeredBy")]
    triggered_by: String,
    #[serde(rename = "triggeredType")]
    triggered_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SandboxLifecycleResponse {
    sandbox_lifecycle_id: Uuid,
    status: String,
    created_by: String,
    created_type: String,
    torndown_by: Option<String>,
    torndown_type: Option<String>,
    unique_users: i32,
    started_at: DateTime<Utc>,
    ended_at: Option<DateTime<Utc>>,
    #[serde(default)]
    created_by_display_name: Option<String>,
    #[serde(default)]
    created_by_avatar_url: Option<String>,
    #[serde(default)]
    torndown_by_display_name: Option<String>,
    #[serde(default)]
    torndown_by_avatar_url: Option<String>,
}


pub fn admin_sandbox_router() -> Router<AppState> {
    Router::new()
        .route("/lifecycles", post(get_sandbox_lifecycles))
        .route("/proxy-lifecycles", get(proxy_get_sandbox_lifecycles))
        .route("/reset", post(reset_sandbox_handler))
        .route("/proxy-reset", post(proxy_reset_sandbox_handler))
}

#[instrument(skip(state))]
async fn reset_sandbox_handler(
    State(state): State<AppState>,
    Json(req): Json<ResetSandboxRequest>,
) -> ApiResponse<()> {
    if state.config.server.app_env != crate::config::env::AppEnvironment::NowasterSandbox {
        return ApiResponse::Error {
            message: "Sandbox reset called in non-sandbox environment".to_string(),
        };
    }

    let expected_secret = std::env::var("SANDBOX_RESET_SECRET").unwrap_or("placeholder".into());

    let has_valid_secret = req.secret.as_deref() == Some(expected_secret.as_str());

    if !has_valid_secret {
        return ApiResponse::Error {
            message: "Sandbox reset attempted without valid authentication".to_string(),
        };
    }

    if let Err(e) = state
        .sandbox_service
        .perform_reset(&req.triggered_by, &req.triggered_type)
        .await
    {
        tracing::error!("Sandbox reset failed: {}", e);
        return ApiResponse::Error {
            message: "Sandbox reset failed".to_string(),
        };
    }

    tracing::info!("✅ Sandbox reset complete");

    ApiResponse::Success { data: () }
}

#[instrument(skip(state))]
async fn get_sandbox_lifecycles(
    State(state): State<AppState>,
    Json(req): Json<GetLifecyclesRequest>,
) -> ApiResponse<Vec<SandboxLifecycleResponse>> {
    if state.config.server.app_env != crate::config::env::AppEnvironment::NowasterSandbox {
        return ApiResponse::Error {
            message: "Not available in non-sandbox environment".to_string(),
        };
    }

    let expected_secret = std::env::var("SANDBOX_RESET_SECRET").unwrap_or("placeholder".into());
    if req.secret != expected_secret {
        return ApiResponse::Error {
            message: "Invalid secret".to_string(),
        };
    }

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
                    created_by_display_name: None,
                    created_by_avatar_url: None,
                    torndown_by_display_name: None,
                    torndown_by_avatar_url: None,
                })
                .collect::<Vec<SandboxLifecycleResponse>>()
        });

    ApiResponse::from_result(lifecycles)
}

#[instrument(skip(state, _admin))]
async fn proxy_get_sandbox_lifecycles(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
) -> Result<Json<ApiResponse<Vec<SandboxLifecycleResponse>>>, StatusCode> {
    if state.config.server.app_env == crate::config::env::AppEnvironment::NowasterSandbox {
        return Err(StatusCode::FORBIDDEN);
    }

    let sandbox_url = std::env::var("SANDBOX_API_URL").map_err(|_| {
        tracing::error!("SANDBOX_API_URL not configured");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let secret = std::env::var("SANDBOX_RESET_SECRET").map_err(|_| {
        tracing::error!("SANDBOX_RESET_SECRET not configured");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/admin/sandbox/lifecycles", sandbox_url))
        .json(&serde_json::json!({ "secret": secret }))
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to reach sandbox API: {}", e);
            StatusCode::BAD_GATEWAY
        })?;

    let body: ApiResponse<Vec<SandboxLifecycleResponse>> = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse sandbox lifecycles response: {}", e);
        StatusCode::BAD_GATEWAY
    })?;

    let lifecycles = match body {
        ApiResponse::Success { data } => data,
        err @ ApiResponse::Error { .. } => return Ok(Json(err)),
    };

    let user_ids: Vec<String> = lifecycles
        .iter()
        .flat_map(|l| {
            let mut ids = vec![];
            if l.created_type == "user" {
                ids.push(l.created_by.clone());
            }
            if l.torndown_type.as_deref() == Some("user") {
                if let Some(id) = &l.torndown_by {
                    ids.push(id.clone());
                }
            }
            ids
        })
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    let user_map: HashMap<String, (String, Option<String>)> = state
        .user_service
        .get_users_by_ids(user_ids)
        .await
        .unwrap_or_default()
        .into_iter()
        .map(|u| (u.id, (u.username, u.avatar_url)))
        .collect();

    let enriched = lifecycles
        .into_iter()
        .map(|mut l| {
            if l.created_type == "user" {
                if let Some((name, avatar)) = user_map.get(&l.created_by) {
                    l.created_by_display_name = Some(name.clone());
                    l.created_by_avatar_url = avatar.clone();
                }
            }
            if l.torndown_type.as_deref() == Some("user") {
                if let Some(id) = l.torndown_by.clone() {
                    if let Some((name, avatar)) = user_map.get(&id) {
                        l.torndown_by_display_name = Some(name.clone());
                        l.torndown_by_avatar_url = avatar.clone();
                    }
                }
            }
            l
        })
        .collect();

    Ok(Json(ApiResponse::Success { data: enriched }))
}

#[instrument(skip(state))]
async fn proxy_reset_sandbox_handler(
    State(state): State<AppState>,
    AdminUser(_admin): AdminUser,
    Json(req): Json<ProxyResetRequest>,
) -> Result<Json<ApiResponse<()>>, StatusCode> {
    if state.config.server.app_env == crate::config::env::AppEnvironment::NowasterSandbox {
        return Err(StatusCode::FORBIDDEN);
    }

    let sandbox_url = std::env::var("SANDBOX_API_URL").map_err(|_| {
        tracing::error!("SANDBOX_API_URL not configured");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let secret = std::env::var("SANDBOX_RESET_SECRET").map_err(|_| {
        tracing::error!("SANDBOX_RESET_SECRET not configured");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    let client = reqwest::Client::new();
    let response = client
        .post(format!("{}/admin/sandbox/reset", sandbox_url))
        .json(&serde_json::json!({
            "secret": secret,
            "triggeredBy": req.triggered_by,
            "triggeredType": req.triggered_type,
        }))
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to reach sandbox API: {}", e);
            StatusCode::BAD_GATEWAY
        })?;

    let body: ApiResponse<()> = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse sandbox reset response: {}", e);
        StatusCode::BAD_GATEWAY
    })?;

    Ok(Json(body))
}
