use axum::routing::get;
use axum::{extract::State, Router};
use tokio::try_join;

use crate::dto::statistics::dashboard::DashboardData;
use crate::router::clerk::ClerkUser;
use crate::router::response::ApiResponse;
use crate::router::root::AppState;

pub fn statistics_router() -> Router<AppState> {
    Router::new().route("/dashboard", get(get_dashboard_data))
}

async fn get_dashboard_data(
    State(state): State<AppState>,
    actor: ClerkUser,
) -> ApiResponse<DashboardData> {
    let result = try_join!(
        state.statistics_service.get_current_streak(actor.clone()),
        state
            .statistics_service
            .get_total_session_time(actor.clone()),
        state
            .statistics_service
            .get_amount_of_sessions(actor.clone()),
    );
    match result {
        Ok((streak, minutes, session_count)) => ApiResponse::Success {
            data: DashboardData {
                streak,
                minutes,
                session_count,
            },
        },
        Err(e) => ApiResponse::Error {
            message: e.to_string(),
        },
    }
}
