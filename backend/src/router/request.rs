use axum::{
    extract::{rejection::JsonRejection, FromRequest, Request},
    Json,
};
use serde::de::DeserializeOwned;
use serde_json::{json, Value};
use validator::Validate;

use super::response::ApiResponse;

pub struct ValidatedRequest<T>(pub T);

impl<S, T> FromRequest<S> for ValidatedRequest<T>
where
    axum::Json<T>: FromRequest<S, Rejection = JsonRejection>,
    S: Send + Sync,
    T: Validate + DeserializeOwned,
{
    type Rejection = ApiResponse<()>;
    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let Json(mut value): Json<Value> =
            Json::<Value>::from_request(req, state)
                .await
                .map_err(|rejection| ApiResponse::Error {
                    message: rejection.body_text(),
                })?;

        value["user_id"] = json!("8fa94312-788e-4c71-a5f3-125f10c218bb");

        let parsed_value: T =
            serde_json::from_value(value).map_err(|rejection| ApiResponse::Error {
                message: rejection.to_string(),
            })?;

        parsed_value.validate().map_err(|e| ApiResponse::Error {
            message: e.to_string(),
        })?;

        Ok(Self(parsed_value))
    }
}
