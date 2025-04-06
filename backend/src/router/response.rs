use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::{Deserialize, Serialize};
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "status", rename_all = "lowercase")]
pub enum ApiResponse<T> {
    Success { data: T },
    Error { message: String },
}
impl<T> ApiResponse<T> {
    pub fn from_result<E: ToString>(result: Result<T, E>) -> Self {
        match result {
            Ok(data) => ApiResponse::Success { data },
            Err(e) => ApiResponse::Error {
                message: e.to_string(),
            },
        }
    }
}

impl<T, E: ToString> From<Result<T, E>> for ApiResponse<T> {
    fn from(result: Result<T, E>) -> Self {
        ApiResponse::from_result(result)
    }
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        match self {
            ApiResponse::Success { data } => (
                StatusCode::OK,
                axum::Json(json!({"status": "success", "data": data})),
            ),
            ApiResponse::Error { message } => (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(json!({"status": "fail", "message": message})),
            ),
        }
        .into_response()
    }
}
