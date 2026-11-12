use axum::{
    body::Bytes,
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::session::stopwatch_session::{
        CreateStopwatchSessionDto, ReadStopwatchSessionDto, UpdateStopwatchSessionDto,
    },
    repository::stopwatch_session::FinishStopwatchError,
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn stopwatch_session_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(get_stopwatch_session_handler)
                .post(create_handler)
                .patch(update_handler),
        )
        .route("/{session_id}", delete(delete_handler))
        .route("/{session_id}/finish", post(finish_handler))
}

#[derive(Debug, Default, Deserialize)]
struct FinishStopwatchBody {
    #[serde(rename = "endTime")]
    end_time: Option<DateTime<Utc>>,
}

fn fail(status: StatusCode, message: String) -> Response {
    (status, Json(json!({"status": "fail", "message": message}))).into_response()
}

fn parse_finish_body(body: &[u8]) -> Result<FinishStopwatchBody, String> {
    if body.iter().all(u8::is_ascii_whitespace) {
        return Ok(FinishStopwatchBody::default());
    }
    serde_json::from_slice(body).map_err(|e| e.to_string())
}

#[instrument(skip(state, body), fields(user_id = %actor, session_id = %session_id))]
async fn finish_handler(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    actor: Actor,
    body: Bytes,
) -> Response {
    let payload = match parse_finish_body(&body) {
        Ok(p) => p,
        Err(msg) => return fail(StatusCode::BAD_REQUEST, msg),
    };
    match state
        .session_service
        .finish_stopwatch_session(session_id, payload.end_time, &actor)
        .await
    {
        Ok(data) => (
            StatusCode::OK,
            Json(json!({"status": "success", "data": data})),
        )
            .into_response(),
        Err(e @ FinishStopwatchError::NotFound) => fail(StatusCode::NOT_FOUND, e.to_string()),
        Err(e @ (FinishStopwatchError::EndBeforeStart | FinishStopwatchError::MissingCategory)) => {
            fail(StatusCode::BAD_REQUEST, e.to_string())
        }
        Err(FinishStopwatchError::Internal(e)) => {
            tracing::error!("finish stopwatch failed: {e:#}");
            fail(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Something went wrong".into(),
            )
        }
    }
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn get_stopwatch_session_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Option<ReadStopwatchSessionDto>> {
    let res = state.stopwatch_service.read_stopwatch_session(&actor).await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn create_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateStopwatchSessionDto>,
) -> ApiResponse<ReadStopwatchSessionDto> {
    let res = state
        .stopwatch_service
        .create_stopwatch_session(payload, &actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor, session_id = %session_id))]
async fn delete_handler(
    State(state): State<AppState>,
    Path(session_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<()> {
    let res = state
        .stopwatch_service
        .delete_stopwatch_session(session_id, &actor)
        .await;
    ApiResponse::from_result(res)
}

#[instrument( skip(state), fields(user_id = %actor))]
async fn update_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateStopwatchSessionDto>,
) -> ApiResponse<ReadStopwatchSessionDto> {
    let res = state
        .stopwatch_service
        .update_stopwatch_session(payload, &actor)
        .await;

    ApiResponse::from_result(res)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_body_defaults_to_now() {
        assert!(parse_finish_body(b"").unwrap().end_time.is_none());
        assert!(parse_finish_body(b"{}").unwrap().end_time.is_none());
    }

    #[test]
    fn parses_end_time() {
        let b = parse_finish_body(br#"{"endTime":"2026-01-01T10:00:00Z"}"#).unwrap();
        assert!(b.end_time.is_some());
        assert!(parse_finish_body(br#"{"endTime":"nope"}"#).is_err());
    }
}
