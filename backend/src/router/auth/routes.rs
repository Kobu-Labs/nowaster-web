use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect, Response},
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use time::Duration;
use tracing::instrument;

use crate::{
    auth::{
        generate_csrf_token,
        providers::{
            discord::DiscordProvider, github::GitHubProvider, google::GoogleProvider, OAuthProvider,
        },
    },
    router::{clerk::Actor, response::ApiResponse, AppState},
    service::user_service::UserService,
};

#[derive(Deserialize)]
pub struct CallbackParams {
    code: String,
    state: String,
}

#[derive(Serialize)]
pub struct TokenResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    #[serde(default)]
    refresh_token: Option<String>,
}

pub fn auth_router() -> Router<AppState> {
    Router::new()
        .route("/oauth/:provider", get(oauth_authorize_handler))
        .route("/callback/:provider", get(oauth_callback_handler))
        .route("/refresh", post(refresh_token_handler))
        .route("/logout", post(logout_handler))
        .route("/me", get(get_current_user_handler))
}

/// Initiate OAuth flow - redirect user to provider
#[instrument(skip(state))]
async fn oauth_authorize_handler(
    Path(provider): Path<String>,
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, Redirect), StatusCode> {
    // Generate CSRF state token
    let csrf_state = generate_csrf_token();

    // Get provider config and build authorization URL
    let auth_url = match provider.as_str() {
        "google" => {
            let config = GoogleProvider::get_config().map_err(|e| {
                tracing::error!("Failed to get Google config: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
            GoogleProvider::build_authorization_url(&config, &csrf_state)
        }
        "github" => {
            let config = GitHubProvider::get_config().map_err(|e| {
                tracing::error!("Failed to get GitHub config: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
            GitHubProvider::build_authorization_url(&config, &csrf_state)
        }
        "discord" => {
            let config = DiscordProvider::get_config().map_err(|e| {
                tracing::error!("Failed to get Discord config: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
            DiscordProvider::build_authorization_url(&config, &csrf_state)
        }
        _ => return Err(StatusCode::BAD_REQUEST),
    };

    // Store CSRF state in cookie (10 min expiry)
    let state_cookie = Cookie::build(("oauth_state", csrf_state))
        .path("/")
        .max_age(Duration::minutes(10))
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .build();

    let jar = jar.add(state_cookie);

    Ok((jar, Redirect::to(&auth_url)))
}

/// Handle OAuth callback from provider
#[instrument(skip(state))]
async fn oauth_callback_handler(
    Path(provider): Path<String>,
    Query(params): Query<CallbackParams>,
    State(state): State<AppState>,
    jar: CookieJar,
    addr: Option<axum::extract::ConnectInfo<SocketAddr>>,
) -> Result<(CookieJar, Redirect), Response> {
    // 1. Validate CSRF state
    let stored_state = jar
        .get("oauth_state")
        .ok_or_else(|| (StatusCode::BAD_REQUEST, "Missing CSRF state").into_response())?
        .value();

    if stored_state != params.state {
        tracing::warn!("CSRF state mismatch");
        return Err((StatusCode::BAD_REQUEST, "Invalid CSRF state").into_response());
    }

    // 2. Exchange code for access token and fetch user profile
    let profile = match provider.as_str() {
        "google" => {
            let config = GoogleProvider::get_config().map_err(|e| {
                tracing::error!("Failed to get Google config: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR.into_response()
            })?;
            let token = GoogleProvider::exchange_code(&config, &params.code)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to exchange code: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "OAuth exchange failed").into_response()
                })?;
            GoogleProvider::fetch_user_profile(&token).await.map_err(|e| {
                tracing::error!("Failed to fetch profile: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch profile").into_response()
            })?
        }
        "github" => {
            let config = GitHubProvider::get_config().map_err(|e| {
                tracing::error!("Failed to get GitHub config: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR.into_response()
            })?;
            let token = GitHubProvider::exchange_code(&config, &params.code)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to exchange code: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "OAuth exchange failed").into_response()
                })?;
            GitHubProvider::fetch_user_profile(&token).await.map_err(|e| {
                tracing::error!("Failed to fetch profile: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch profile").into_response()
            })?
        }
        "discord" => {
            let config = DiscordProvider::get_config().map_err(|e| {
                tracing::error!("Failed to get Discord config: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR.into_response()
            })?;
            let token = DiscordProvider::exchange_code(&config, &params.code)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to exchange code: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "OAuth exchange failed").into_response()
                })?;
            DiscordProvider::fetch_user_profile(&token).await.map_err(|e| {
                tracing::error!("Failed to fetch profile: {}", e);
                (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch profile").into_response()
            })?
        }
        _ => return Err((StatusCode::BAD_REQUEST, "Invalid provider").into_response()),
    };

    // 3. Handle OAuth login (create/update user, link account, generate tokens)
    let user_agent = None; // Could extract from headers if needed
    let ip = addr.map(|info| info.0.ip());

    let (access_token, refresh_token, _user_id) = state
        .auth_service
        .handle_oauth_login(&provider, profile, user_agent, ip)
        .await
        .map_err(|e| {
            tracing::error!("Failed to handle OAuth login: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Login failed").into_response()
        })?;

    // 4. Set auth cookies
    let access_cookie = Cookie::build(("access_token", access_token))
        .path("/")
        .max_age(Duration::minutes(15))
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .build();

    let refresh_cookie = Cookie::build(("refresh_token", refresh_token))
        .path("/")
        .max_age(Duration::days(30))
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .build();

    // 5. Clear CSRF state cookie and set auth cookies
    let jar = jar
        .remove(Cookie::from("oauth_state"))
        .add(access_cookie)
        .add(refresh_cookie);

    // 6. Redirect to frontend home page
    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
    Ok((jar, Redirect::to(&format!("{}/home", frontend_url))))
}

/// Refresh access token using refresh token
#[instrument(skip(state))]
async fn refresh_token_handler(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(req): Json<RefreshRequest>,
    addr: Option<axum::extract::ConnectInfo<SocketAddr>>,
) -> Result<(CookieJar, Json<ApiResponse<TokenResponse>>), StatusCode> {
    // Get refresh token from cookie or request body
    let refresh_token = req
        .refresh_token
        .or_else(|| jar.get("refresh_token").map(|c| c.value().to_string()))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let user_agent = None;
    let ip = addr.map(|info| info.0.ip());

    // Refresh tokens
    let (access_token, new_refresh_token, _user_id) = state
        .auth_service
        .refresh_access_token(&refresh_token, user_agent, ip)
        .await
        .map_err(|e| {
            tracing::error!("Token refresh failed: {}", e);
            StatusCode::UNAUTHORIZED
        })?;

    // Update cookies
    let access_cookie = Cookie::build(("access_token", access_token.clone()))
        .path("/")
        .max_age(Duration::minutes(15))
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .build();

    let refresh_cookie = Cookie::build(("refresh_token", new_refresh_token.clone()))
        .path("/")
        .max_age(Duration::days(30))
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .build();

    let jar = jar.add(access_cookie).add(refresh_cookie);

    let response = TokenResponse {
        access_token,
        refresh_token: new_refresh_token,
        expires_in: 900, // 15 minutes
    };

    Ok((jar, Json(ApiResponse::Success { data: response })))
}

/// Logout user by revoking refresh token
#[instrument(skip(state))]
async fn logout_handler(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, StatusCode), StatusCode> {
    // Get refresh token from cookie
    if let Some(refresh_cookie) = jar.get("refresh_token") {
        let refresh_token = refresh_cookie.value();
        state
            .auth_service
            .logout(refresh_token)
            .await
            .map_err(|e| {
                tracing::error!("Logout failed: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;
    }

    // Clear auth cookies
    let jar = jar
        .remove(Cookie::from("access_token"))
        .remove(Cookie::from("refresh_token"));

    Ok((jar, StatusCode::NO_CONTENT))
}

/// Get current authenticated user
#[instrument(skip(state))]
async fn get_current_user_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    let user = state
        .user_service
        .get_user_by_id(actor.user_id.clone())
        .await
        .map_err(|e| {
            tracing::error!("Failed to get user: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .ok_or(StatusCode::NOT_FOUND)?;

    let response = serde_json::json!({
        "id": user.id,
        "username": user.username,
        "avatarUrl": user.avatar_url,
        "role": actor.role.to_string(),
    });

    Ok(Json(ApiResponse::Success { data: response }))
}
