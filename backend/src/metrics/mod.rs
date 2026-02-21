mod layer;
mod worker;

pub use layer::MetricsLayer;
pub use worker::metrics_worker;

use uuid::Uuid;

pub enum MetricEvent {
    HttpRequest {
        request_id: Uuid,
        method: String,
        path: String,
        status_code: i16,
        duration_ms: f64,
    },
    DbQuery {
        request_id: Option<Uuid>,
        query_name: String,
        duration_ms: f64,
    },
}

#[macro_export]
macro_rules! named_query {
    ($name:literal, $query:expr) => {{
        use tracing::Instrument;
        let span = tracing::info_span!(target: "db_metrics", "db_query", query.name = $name);
        ($query).instrument(span).await
    }};
}
