use sqlx::PgPool;
use tokio::sync::mpsc;
use tracing::{debug, warn};

use super::MetricEvent;

pub async fn metrics_worker(mut rx: mpsc::Receiver<MetricEvent>, pool: PgPool) {
    while let Some(event) = rx.recv().await {
        match event {
            MetricEvent::HttpRequest {
                request_id,
                method,
                path,
                status_code,
                duration_ms,
                user_id,
            } => {
                match sqlx::query(
                    "INSERT INTO metrics_handler (request_id, method, path, status_code, duration_ms, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
                )
                .bind(request_id)
                .bind(&method)
                .bind(&path)
                .bind(status_code)
                .bind(duration_ms)
                .bind(user_id.as_deref())
                .execute(&pool)
                .await
                {
                    Ok(_) => debug!(request_id = %request_id, method, path, status_code, duration_ms, user_id, "tracked http request"),
                    Err(e) => warn!(error = %e, "failed to track http request metric"),
                }
            }
            MetricEvent::DbQuery {
                request_id,
                query_name,
                duration_ms,
            } => {
                match sqlx::query(
                    "INSERT INTO metrics_db_query (request_id, query_name, duration_ms) VALUES ($1, $2, $3)",
                )
                .bind(request_id)
                .bind(&query_name)
                .bind(duration_ms)
                .execute(&pool)
                .await
                {
                    Ok(_) => debug!(request_id = ?request_id, query_name, duration_ms, "tracked db query"),
                    Err(e) => warn!(error = %e, "failed to track db query metric"),
                }
            }
        }
    }
}
