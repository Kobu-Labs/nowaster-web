use axum::Router;

use crate::router::root::AppState;

use super::{
    fixed::fixed_session_router, stopwatch::stopwatch_session_router,
    template::session_template_router,
};

pub fn session_router() -> Router<AppState> {
    Router::new()
        .nest("/fixed", fixed_session_router())
        .nest("/stopwatch", stopwatch_session_router())
        .nest("/template", session_template_router())
}
