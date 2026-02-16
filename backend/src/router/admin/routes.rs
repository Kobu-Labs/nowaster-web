use axum::Router;

use crate::router::{
    admin::{
        backups::admin_backups_router, impersonation::admin_impersonation_router,
        release::admin_release_router, sandbox::admin_sandbox_router, users::admin_users_router,
    },
    root::AppState,
};

pub fn admin_router() -> Router<AppState> {
    Router::new()
        .nest("/users", admin_users_router())
        .nest("/impersonate", admin_impersonation_router())
        .nest("/backups", admin_backups_router())
        .nest("/sandbox", admin_sandbox_router())
        .nest("/releases", admin_release_router())
}
