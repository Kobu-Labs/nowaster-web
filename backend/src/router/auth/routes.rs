use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Redirect, Response},
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::cookie::{Cookie, CookieJar};
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::Mutex;
use time::Duration;
use tracing::instrument;

use crate::{
    auth::{
        generate_csrf_token,
        providers::{
            discord::DiscordProvider, github::GitHubProvider, google::GoogleProvider, OAuthProvider,
        },
    },
    router::{
        auth::tokens::api_tokens_router, clerk::Actor, response::ApiResponse, root::AppState,
    },
};

use once_cell::sync::Lazy;

static GUEST_POOL: Lazy<Mutex<VecDeque<String>>> = Lazy::new(|| Mutex::new(VecDeque::new()));

/// Initialize guest pool by loading existing guest users from database
async fn init_guest_pool(pool: &sqlx::PgPool) -> Result<(), sqlx::Error> {
    let guest_ids: Vec<String> =
        sqlx::query_scalar("SELECT id FROM \"user\" WHERE id LIKE 'guest_%' ORDER BY id")
            .fetch_all(pool)
            .await?;

    let mut guest_pool = GUEST_POOL.lock().unwrap();
    guest_pool.clear();
    for id in guest_ids {
        guest_pool.push_back(id);
    }

    tracing::info!("Initialized guest pool with {} users", guest_pool.len());
    Ok(())
}

/// Replenish guest pool if below threshold by creating new guest users
async fn replenish_guest_pool_if_needed(pool: &sqlx::PgPool) {
    const REPLENISH_THRESHOLD: usize = 50;
    const REPLENISH_BATCH_SIZE: usize = 100;

    let current_size = {
        let pool = GUEST_POOL.lock().unwrap();
        pool.len()
    };

    if current_size < REPLENISH_THRESHOLD {
        tracing::info!(
            "Guest pool below threshold ({} < {}), replenishing...",
            current_size,
            REPLENISH_THRESHOLD
        );

        match crate::sandbox::create_guest_user_pool(pool, REPLENISH_BATCH_SIZE).await {
            Ok(created) => {
                tracing::info!("✅ Created {} new guest users", created);

                if let Err(e) = init_guest_pool(pool).await {
                    tracing::error!("Failed to reload guest pool after replenishment: {}", e);
                }
            }
            Err(e) => {
                tracing::error!("Failed to create guest users: {}", e);
            }
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CallbackParams {
    code: String,
    state: String,
}

#[derive(Debug, Serialize)]
pub struct TokenResponse {
    access_token: String,
    refresh_token: String,
    expires_in: i64,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    #[serde(default)]
    refresh_token: Option<String>,
}

const ACCESS_TOKEN_EXPIRE_SECONDS: i64 = 900;

pub fn auth_router() -> Router<AppState> {
    Router::new()
        .route("/oauth/{provider}", get(oauth_authorize_handler))
        .route("/callback/{provider}", get(oauth_callback_handler))
        .route("/refresh", post(refresh_token_handler))
        .route("/logout", post(logout_handler))
        .route("/me", get(get_current_user_handler))
        .route("/guest", post(assign_guest_handler))
        .nest("/tokens", api_tokens_router())
}

/// Initiate OAuth flow - redirect user to provider
#[instrument(skip(state))]
async fn oauth_authorize_handler(
    Path(provider): Path<String>,
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, Redirect), StatusCode> {
    println!(
        "🚀 [AUTHORIZE] Starting OAuth flow for provider: {}",
        provider
    );

    // Generate CSRF state token
    let csrf_state = generate_csrf_token();
    println!("🚀 [AUTHORIZE] Generated CSRF state: {}", csrf_state);

    // Get provider config and build authorization URL
    let auth_url = match provider.as_str() {
        "google" => {
            let config = GoogleProvider::config_from(&state.config.google);
            GoogleProvider::build_authorization_url(&config, &csrf_state)
        }
        "github" => {
            let config = GitHubProvider::config_from(&state.config.github);
            GitHubProvider::build_authorization_url(&config, &csrf_state)
        }
        "discord" => {
            let config = DiscordProvider::config_from(&state.config.discord);
            DiscordProvider::build_authorization_url(&config, &csrf_state)
        }
        _ => {
            println!("❌ [AUTHORIZE] Invalid provider: {}", provider);
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    println!("✅ [AUTHORIZE] Authorization URL: {}", auth_url);

    // Store CSRF state in cookie (10 min expiry)
    // Configure cookie based on environment
    let mut state_cookie_builder = Cookie::build(("oauth_state", csrf_state.clone()))
        .path("/")
        .max_age(Duration::minutes(10))
        .http_only(true);

    match state.config.server.app_env {
        crate::config::env::AppEnvironment::NowasterProduction => {
            state_cookie_builder = state_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
        }
        crate::config::env::AppEnvironment::NowasterStaging => {
            // Staging needs SameSite=None for OAuth redirects to work
            state_cookie_builder = state_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
        }
        crate::config::env::AppEnvironment::NowasterSandbox => {
            state_cookie_builder = state_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
        }
        crate::config::env::AppEnvironment::NowasterLocal => {
            // Local development - least strict
            state_cookie_builder = state_cookie_builder
                .secure(false)
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
        }
    }

    let state_cookie = state_cookie_builder.build();

    let jar = jar.add(state_cookie);

    println!("✅ [AUTHORIZE] CSRF state cookie set, redirecting to provider");
    Ok((jar, Redirect::to(&auth_url)))
}

/// Handle OAuth callback from provider
#[instrument(skip(state))]
async fn oauth_callback_handler(
    Path(provider): Path<String>,
    Query(params): Query<CallbackParams>,
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, Redirect), Response> {
    println!(
        "🔄 [CALLBACK] Received OAuth callback for provider: {}",
        provider
    );
    println!(
        "🔄 [CALLBACK] Code length: {}, State: {}",
        params.code.len(),
        params.state
    );

    // 1. Validate CSRF state
    let stored_state = jar
        .get("oauth_state")
        .ok_or_else(|| {
            println!("❌ [CALLBACK] Missing oauth_state cookie!");
            (StatusCode::BAD_REQUEST, "Missing CSRF state").into_response()
        })?
        .value();

    println!("🔄 [CALLBACK] Stored state: {}", stored_state);

    if stored_state != params.state {
        println!(
            "❌ [CALLBACK] CSRF state mismatch! stored={}, received={}",
            stored_state, params.state
        );
        return Err((StatusCode::BAD_REQUEST, "Invalid CSRF state").into_response());
    }

    println!("✅ [CALLBACK] CSRF state validated");

    // 2. Exchange code for access token and fetch user profile
    let profile = match provider.as_str() {
        "google" => {
            let config = GoogleProvider::config_from(&state.config.google);
            let token = GoogleProvider::exchange_code(&config, &params.code)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to exchange code: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "OAuth exchange failed").into_response()
                })?;
            GoogleProvider::fetch_user_profile(&token)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to fetch profile: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch profile").into_response()
                })?
        }
        "github" => {
            let config = GitHubProvider::config_from(&state.config.github);
            let token = GitHubProvider::exchange_code(&config, &params.code)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to exchange code: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "OAuth exchange failed").into_response()
                })?;
            GitHubProvider::fetch_user_profile(&token)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to fetch profile: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch profile").into_response()
                })?
        }
        "discord" => {
            let config = DiscordProvider::config_from(&state.config.discord);
            let token = DiscordProvider::exchange_code(&config, &params.code)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to exchange code: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "OAuth exchange failed").into_response()
                })?;
            DiscordProvider::fetch_user_profile(&token)
                .await
                .map_err(|e| {
                    tracing::error!("Failed to fetch profile: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, "Failed to fetch profile").into_response()
                })?
        }
        _ => {
            println!("❌ [CALLBACK] Invalid provider: {}", provider);
            return Err((StatusCode::BAD_REQUEST, "Invalid provider").into_response());
        }
    };

    println!("✅ [CALLBACK] User profile fetched successfully");

    // 3. Handle OAuth login (create/update user, link account, generate tokens)
    let user_agent = None; // Could extract from headers if needed
    let ip = None; // Could extract from ConnectInfo if needed

    println!("🔄 [CALLBACK] Calling handle_oauth_login...");
    let (access_token, refresh_token, user_id, is_new_user) = state
        .auth_service
        .handle_oauth_login(&provider, profile, user_agent, ip)
        .await
        .map_err(|e| {
            println!("❌ [CALLBACK] Failed to handle OAuth login: {}", e);
            tracing::error!("Failed to handle OAuth login: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Login failed").into_response()
        })?;

    println!(
        "✅ [CALLBACK] Tokens generated for user: {}, New user: {}",
        user_id, is_new_user
    );

    // 4. Set auth cookies
    // Note: access_token is NOT http_only so JS can read it for Authorization header
    // refresh_token IS http_only for security (only used by backend)
    println!("🔄 [CALLBACK] Setting auth cookies...");

    let mut access_cookie_builder = Cookie::build(("access_token", access_token.clone()))
        .path("/")
        .max_age(Duration::minutes(15))
        .http_only(false); // Allow JavaScript to read for Authorization header

    let mut refresh_cookie_builder = Cookie::build(("refresh_token", refresh_token.clone()))
        .path("/")
        .max_age(Duration::days(30))
        .http_only(true); // Keep secure - only backend can read

    match state.config.server.app_env {
        crate::config::env::AppEnvironment::NowasterProduction => {
            access_cookie_builder = access_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
        }
        crate::config::env::AppEnvironment::NowasterStaging => {
            // Staging needs SameSite=None for OAuth redirects to work
            access_cookie_builder = access_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
        }
        crate::config::env::AppEnvironment::NowasterSandbox => {
            access_cookie_builder = access_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
        }
        crate::config::env::AppEnvironment::NowasterLocal => {
            // Local development - least strict
            access_cookie_builder = access_cookie_builder
                .secure(false)
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(false)
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
        }
    }

    let access_cookie = access_cookie_builder.build();
    let refresh_cookie = refresh_cookie_builder.build();

    println!(
        "✅ [CALLBACK] Cookies created: access_token={} chars, refresh_token={} chars",
        access_token.len(),
        refresh_token.len()
    );

    // 5. Clear CSRF state cookie and set auth cookies
    let jar = jar
        .remove(Cookie::from("oauth_state"))
        .add(access_cookie)
        .add(refresh_cookie);

    println!("✅ [CALLBACK] Cookies added to jar");

    // 6. Redirect to frontend callback page with tokens
    // Note: Cookies are set but may not work cross-origin (localhost:4008 -> localhost:3000)
    // So we also pass tokens via URL for the frontend to handle
    let frontend_url = &state.config.frontend.url;
    println!("FRONTEND URL: {}", frontend_url);
    let first_time_param = if is_new_user { "&firstTime=true" } else { "" };
    let redirect_url = format!(
        "{}/auth/callback?access_token={}&refresh_token={}{}",
        frontend_url,
        urlencoding::encode(&access_token),
        urlencoding::encode(&refresh_token),
        first_time_param
    );
    println!("🔄 [CALLBACK] Redirecting to: {}", redirect_url);
    Ok((jar, Redirect::to(&redirect_url)))
}

/// Refresh access token using refresh token
#[instrument(skip(state))]
async fn refresh_token_handler(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(req): Json<RefreshRequest>,
) -> Result<(CookieJar, Json<ApiResponse<TokenResponse>>), StatusCode> {
    // Get refresh token from cookie or request body
    let refresh_token = req
        .refresh_token
        .or_else(|| jar.get("refresh_token").map(|c| c.value().to_string()))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let user_agent = None;
    let ip = None;

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
    // Note: access_token is NOT http_only so JS can read it
    // refresh_token IS http_only for security
    let mut access_cookie_builder = Cookie::build(("access_token", access_token.clone()))
        .path("/")
        .max_age(Duration::seconds(ACCESS_TOKEN_EXPIRE_SECONDS))
        .http_only(false); // Allow JavaScript to read

    let mut refresh_cookie_builder = Cookie::build(("refresh_token", new_refresh_token.clone()))
        .path("/")
        .max_age(Duration::days(30))
        .http_only(true); // Keep secure

    match state.config.server.app_env {
        crate::config::env::AppEnvironment::NowasterProduction => {
            access_cookie_builder = access_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
        }
        crate::config::env::AppEnvironment::NowasterStaging => {
            // Staging needs SameSite=None for OAuth redirects to work
            access_cookie_builder = access_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
        }
        crate::config::env::AppEnvironment::NowasterSandbox => {
            access_cookie_builder = access_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(true)
                .domain(".nowaster.app")
                .same_site(axum_extra::extract::cookie::SameSite::None);
        }
        crate::config::env::AppEnvironment::NowasterLocal => {
            // Local development - least strict
            access_cookie_builder = access_cookie_builder
                .secure(false)
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
            refresh_cookie_builder = refresh_cookie_builder
                .secure(false)
                .same_site(axum_extra::extract::cookie::SameSite::Lax);
        }
    }

    let access_cookie = access_cookie_builder.build();
    let refresh_cookie = refresh_cookie_builder.build();

    let jar = jar.add(access_cookie).add(refresh_cookie);

    let response = TokenResponse {
        access_token,
        refresh_token: new_refresh_token,
        expires_in: ACCESS_TOKEN_EXPIRE_SECONDS,
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

async fn assign_guest_handler(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, Json<ApiResponse<TokenResponse>>), axum::http::StatusCode> {
    if state.config.server.app_env != crate::config::env::AppEnvironment::NowasterSandbox {
        tracing::warn!("Guest endpoint called in non-sandbox environment");
        return Err(axum::http::StatusCode::FORBIDDEN);
    }

    let needs_init = {
        let pool = GUEST_POOL.lock().unwrap();
        pool.is_empty()
    };

    if needs_init {
        if let Err(e) = init_guest_pool(&state.pool).await {
            tracing::error!("Failed to initialize guest pool: {}", e);
            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
        }
    }

    let guest_id = if let Some(cookie) = jar.get("sandbox_guest_id") {
        let existing_guest = cookie.value().to_string();
        tracing::info!("Reusing existing guest from cookie: {}", existing_guest);
        existing_guest
    } else {
        let guest_id = {
            let mut pool = GUEST_POOL.lock().unwrap();
            match pool.pop_front() {
                Some(id) => id,
                None => {
                    tracing::error!("Guest pool exhausted!");
                    return Err(axum::http::StatusCode::SERVICE_UNAVAILABLE);
                }
            }
        };

        tracing::info!("Assigned new guest from pool: {}", guest_id);

        let pool_clone = state.pool.clone();
        tokio::spawn(async move {
            replenish_guest_pool_if_needed(&pool_clone).await;
        });

        guest_id
    };

    let guest_num = guest_id.strip_prefix("guest_").unwrap_or("0");
    let display_name = format!("Guest #{}", guest_num.trim_start_matches('0'));

    let access_token = match crate::auth::generate_access_token(
        &guest_id,
        crate::router::clerk::UserRole::User,
        display_name,
        state.config.server.app_env.as_str().to_string(),
    ) {
        Ok(token) => token,
        Err(e) => {
            tracing::error!("Failed to generate access token: {}", e);
            return Err(axum::http::StatusCode::INTERNAL_SERVER_ERROR);
        }
    };

    let refresh_token = format!("{}_refresh", guest_id);

    let mut access_cookie_builder = Cookie::build(("access_token", access_token.clone()))
        .path("/")
        .max_age(Duration::hours(12))
        .http_only(false);

    let mut refresh_cookie_builder = Cookie::build(("refresh_token", refresh_token.clone()))
        .path("/")
        .max_age(Duration::hours(12))
        .http_only(true);

    let mut guest_id_cookie_builder = Cookie::build(("sandbox_guest_id", guest_id.clone()))
        .path("/")
        .max_age(Duration::hours(12))
        .http_only(true);

    access_cookie_builder = access_cookie_builder
        .secure(true)
        .domain(".nowaster.app")
        .same_site(axum_extra::extract::cookie::SameSite::None);

    refresh_cookie_builder = refresh_cookie_builder
        .secure(true)
        .domain(".nowaster.app")
        .same_site(axum_extra::extract::cookie::SameSite::None);

    guest_id_cookie_builder = guest_id_cookie_builder
        .secure(true)
        .domain(".nowaster.app")
        .same_site(axum_extra::extract::cookie::SameSite::None);

    let jar = jar
        .add(access_cookie_builder.build())
        .add(refresh_cookie_builder.build())
        .add(guest_id_cookie_builder.build());

    let response = TokenResponse {
        access_token,
        refresh_token,
        expires_in: 43200,
    };

    Ok((jar, Json(ApiResponse::Success { data: response })))
}
