use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{delete, get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::router::{clerk::Actor, root::AppState};

#[derive(Deserialize)]
pub struct CreateTokenRequest {
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "expiresInDays")]
    pub expires_in_days: Option<i64>,
}

#[derive(Serialize)]
pub struct TokenResponse {
    pub token: String,
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<String>,
}

#[derive(Serialize)]
pub struct ListTokenResponse {
    pub id: Uuid,
    pub name: String,
    pub usage_count: i32,
    pub description: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "expiresAt")]
    pub expires_at: Option<String>,
    #[serde(rename = "lastUsedAt")]
    pub last_used_at: Option<String>,
    #[serde(rename = "revokedAt")]
    pub revoked_at: Option<String>,
}

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub status: String,
    pub data: T,
}

pub fn api_tokens_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_tokens))
        .route("/", post(create_token))
        .route("/{id}", delete(revoke_token))
}

async fn list_tokens(
    actor: Actor,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<ListTokenResponse>>>, StatusCode> {
    let tokens = state
        .auth_service
        .list_api_tokens(&actor.user_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response_tokens = tokens
        .into_iter()
        .map(|t| ListTokenResponse {
            id: t.id,
            name: t.name,
            usage_count: t.usage_count,
            description: t.description,
            created_at: t.created_at.to_rfc3339(),
            expires_at: t.expires_at.map(|dt| dt.to_rfc3339()),
            last_used_at: t.last_used_at.map(|dt| dt.to_rfc3339()),
            revoked_at: t.revoked_at.map(|dt| dt.to_rfc3339()),
        })
        .collect();

    Ok(Json(ApiResponse {
        status: "success".to_string(),
        data: response_tokens,
    }))
}

async fn create_token(
    actor: Actor,
    State(state): State<AppState>,
    Json(req): Json<CreateTokenRequest>,
) -> Result<Json<ApiResponse<TokenResponse>>, StatusCode> {
    let (token, id) = state
        .auth_service
        .create_api_token(
            &actor.user_id,
            &req.name,
            req.description.as_deref(),
            req.expires_in_days,
        )
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let record = state
        .auth_service
        .list_api_tokens(&actor.user_id)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?
        .into_iter()
        .find(|t| t.id == id)
        .ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(ApiResponse {
        status: "success".to_string(),
        data: TokenResponse {
            token,
            id: record.id,
            name: record.name,
            description: record.description,
            created_at: record.created_at.to_rfc3339(),
            expires_at: record.expires_at.map(|dt| dt.to_rfc3339()),
        },
    }))
}

async fn revoke_token(
    actor: Actor,
    State(state): State<AppState>,
    Path(token_id): Path<Uuid>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    state
        .auth_service
        .revoke_api_token(token_id, &actor.user_id, "user_requested")
        .await
        .map_err(|_| StatusCode::NOT_FOUND)?;

    Ok(Json(ApiResponse {
        status: "success".to_string(),
        data: serde_json::json!({ "success": true }),
    }))
}
