use axum::{
    extract::{rejection::JsonRejection, Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{delete, get},
    Json, Router,
};
use serde::Serialize;
use serde_json::json;
use tracing::instrument;
use uuid::Uuid;
use validator::{Validate, ValidationErrors};

use crate::dto::block_rule::rule::CreateBlockRuleDto;
use crate::router::clerk::Actor;
use crate::router::root::AppState;
use crate::service::block_rule_service::BlockRuleError;

pub fn block_rule_router() -> Router<AppState> {
    Router::new()
        .route("/", get(list_handler).post(create_handler))
        .route("/{id}", delete(delete_handler))
}

fn success<T: Serialize>(data: T) -> Response {
    (
        StatusCode::OK,
        Json(json!({"status": "success", "data": data})),
    )
        .into_response()
}

fn failure(err: BlockRuleError) -> Response {
    let status = match err {
        BlockRuleError::Duplicate => StatusCode::CONFLICT,
        BlockRuleError::NotFound => StatusCode::NOT_FOUND,
        BlockRuleError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
    };
    let message = match err {
        BlockRuleError::Internal(_) => "Something went wrong".to_string(),
        other => other.to_string(),
    };
    (status, Json(json!({"status": "fail", "message": message}))).into_response()
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn list_handler(State(state): State<AppState>, actor: Actor) -> Response {
    match state.block_rule_service.list(&actor).await {
        Ok(rules) => success(rules),
        Err(e) => failure(e),
    }
}

fn bad_request(message: String) -> Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({"status": "fail", "message": message})),
    )
        .into_response()
}

/// Joins the validation error codes into a readable reason, e.g. `pattern_empty`.
fn validation_message(errors: &ValidationErrors) -> String {
    let mut codes: Vec<String> = errors
        .field_errors()
        .values()
        .flat_map(|errs| errs.iter().map(|e| e.code.to_string()))
        .collect();
    codes.sort();
    if codes.is_empty() {
        "Invalid request".to_string()
    } else {
        codes.join(", ")
    }
}

/// Parses and validates the create body, mapping every failure to a 400 response.
fn parse_create_body(
    body: Result<Json<CreateBlockRuleDto>, JsonRejection>,
) -> Result<CreateBlockRuleDto, Box<Response>> {
    let Json(payload) = body.map_err(|e| Box::new(bad_request(e.body_text())))?;
    payload
        .validate()
        .map_err(|e| Box::new(bad_request(validation_message(&e))))?;
    Ok(payload)
}

#[instrument(skip(state, body), fields(user_id = %actor))]
async fn create_handler(
    State(state): State<AppState>,
    actor: Actor,
    body: Result<Json<CreateBlockRuleDto>, JsonRejection>,
) -> Response {
    let payload = match parse_create_body(body) {
        Ok(p) => p,
        Err(resp) => return *resp,
    };
    match state
        .block_rule_service
        .create(&payload.pattern, &actor)
        .await
    {
        Ok(rule) => success(rule),
        Err(e) => failure(e),
    }
}

#[instrument(skip(state), fields(user_id = %actor, rule_id = %id))]
async fn delete_handler(
    State(state): State<AppState>,
    actor: Actor,
    Path(id): Path<Uuid>,
) -> Response {
    match state.block_rule_service.delete(id, &actor).await {
        Ok(()) => success(()),
        Err(e) => failure(e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_pattern_maps_to_400_with_fail_status() {
        let resp = parse_create_body(Ok(Json(CreateBlockRuleDto {
            pattern: "https://youtube.com".into(),
        })))
        .unwrap_err();
        assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    }

    #[test]
    fn valid_pattern_passes() {
        let ok = parse_create_body(Ok(Json(CreateBlockRuleDto {
            pattern: "youtube.com".into(),
        })));
        assert!(ok.is_ok());
    }

    #[test]
    fn message_names_the_reason() {
        let dto = CreateBlockRuleDto {
            pattern: "  ".into(),
        };
        let errors = dto.validate().unwrap_err();
        assert_eq!(validation_message(&errors), "pattern_empty");
    }
}
