use std::{collections::HashMap, time::Instant};

use tokio::sync::mpsc;
use tracing::{
    field::{Field, Visit},
    span::{Attributes, Id, Record},
    Event, Subscriber,
};
use tracing_subscriber::{layer::Context, registry::LookupSpan, Layer};
use uuid::Uuid;

use super::MetricEvent;

pub struct MetricsLayer {
    tx: mpsc::Sender<MetricEvent>,
}

impl MetricsLayer {
    pub fn new(tx: mpsc::Sender<MetricEvent>) -> Self {
        Self { tx }
    }
}

struct HttpSpanData {
    start: Instant,
    request_id: Uuid,
    method: String,
    path: String,
    status_code: Option<i16>,
}

// Only carries the name; timing comes from the sqlx::query event.
struct DbSpanData {
    query_name: String,
}

struct RequestContext {
    request_id: Uuid,
}

// General-purpose visitor used for span attrs and on_record.
struct FieldVisitor(HashMap<String, String>);

impl FieldVisitor {
    fn new() -> Self {
        Self(HashMap::new())
    }

    fn get(&self, key: &str) -> Option<String> {
        self.0.get(key).cloned()
    }
}

impl Visit for FieldVisitor {
    fn record_debug(&mut self, field: &Field, value: &dyn std::fmt::Debug) {
        self.0
            .insert(field.name().to_string(), format!("{:?}", value));
    }

    fn record_str(&mut self, field: &Field, value: &str) {
        self.0.insert(field.name().to_string(), value.to_string());
    }

    fn record_i64(&mut self, field: &Field, value: i64) {
        self.0.insert(field.name().to_string(), value.to_string());
    }

    fn record_u64(&mut self, field: &Field, value: u64) {
        self.0.insert(field.name().to_string(), value.to_string());
    }
}

// Typed visitor that extracts exactly the fields we need from sqlx::query events.
#[derive(Default)]
struct SqlxEventVisitor {
    elapsed_secs: Option<f64>,
}

impl Visit for SqlxEventVisitor {
    fn record_f64(&mut self, field: &Field, value: f64) {
        if field.name() == "elapsed_secs" {
            self.elapsed_secs = Some(value);
        }
    }

    fn record_debug(&mut self, _field: &Field, _value: &dyn std::fmt::Debug) {}
    fn record_str(&mut self, _field: &Field, _value: &str) {}
    fn record_u64(&mut self, _field: &Field, _value: u64) {}
}

impl<S> Layer<S> for MetricsLayer
where
    S: Subscriber + for<'lookup> LookupSpan<'lookup>,
{
    fn on_new_span(&self, attrs: &Attributes<'_>, id: &Id, ctx: Context<'_, S>) {
        let span = ctx.span(id).expect("Span not found");
        let mut extensions = span.extensions_mut();

        let parent_request_id = if let Some(parent_id) = attrs.parent() {
            ctx.span(parent_id)
        } else if attrs.is_contextual() {
            ctx.lookup_current()
        } else {
            None
        }
        .and_then(|parent| {
            parent
                .extensions()
                .get::<RequestContext>()
                .map(|rc| rc.request_id)
        });

        let name = attrs.metadata().name();
        let target = attrs.metadata().target();

        if name == "http_request" {
            let mut visitor = FieldVisitor::new();
            attrs.record(&mut visitor);

            let request_id = visitor
                .get("request_id")
                .and_then(|s| Uuid::parse_str(&s).ok())
                .unwrap_or_else(Uuid::new_v4);

            extensions.insert(RequestContext { request_id });
            extensions.insert(HttpSpanData {
                start: Instant::now(),
                request_id,
                method: visitor.get("method").unwrap_or_default(),
                path: visitor.get("uri").unwrap_or_default(),
                status_code: None,
            });
        } else if target == "db_metrics" && name == "db_query" {
            let mut visitor = FieldVisitor::new();
            attrs.record(&mut visitor);

            if let Some(request_id) = parent_request_id {
                extensions.insert(RequestContext { request_id });
            }
            extensions.insert(DbSpanData {
                query_name: visitor.get("query.name").unwrap_or_default(),
            });
        } else if let Some(request_id) = parent_request_id {
            extensions.insert(RequestContext { request_id });
        }
    }

    fn on_record(&self, id: &Id, values: &Record<'_>, ctx: Context<'_, S>) {
        let span = ctx.span(id).expect("Span not found");
        let mut extensions = span.extensions_mut();

        if let Some(data) = extensions.get_mut::<HttpSpanData>() {
            let mut visitor = FieldVisitor::new();
            values.record(&mut visitor);
            if let Some(status) = visitor.get("http.status_code") {
                if let Ok(code) = status.parse::<i16>() {
                    data.status_code = Some(code);
                }
            }
        }
    }

    // Fires when sqlx finishes executing a query. If the current span is one of
    // our named db_query spans we extract elapsed_secs + rows_returned from sqlx
    // and emit a DbQuery metric with the human-readable name.
    fn on_event(&self, event: &Event<'_>, ctx: Context<'_, S>) {
        if event.metadata().target() != "sqlx::query" {
            return;
        }

        let (query_name, request_id) = {
            let current_span = match ctx.lookup_current() {
                Some(span) => span,
                None => return,
            };
            let extensions = current_span.extensions();
            let query_name = match extensions.get::<DbSpanData>() {
                Some(data) => data.query_name.clone(),
                None => return, // not a named_query! site — skip
            };
            let request_id = extensions.get::<RequestContext>().map(|rc| rc.request_id);
            (query_name, request_id)
        };

        let mut visitor = SqlxEventVisitor::default();
        event.record(&mut visitor);

        if let Some(elapsed_secs) = visitor.elapsed_secs {
            let _ = self.tx.try_send(MetricEvent::DbQuery {
                request_id,
                query_name,
                duration_ms: elapsed_secs * 1000.0,
            });
        }
    }

    fn on_close(&self, id: Id, ctx: Context<'_, S>) {
        let span = match ctx.span(&id) {
            Some(s) => s,
            None => return,
        };

        if span.metadata().name() != "http_request" {
            return;
        }

        let extensions = span.extensions();
        if let Some(data) = extensions.get::<HttpSpanData>() {
            if let Some(status_code) = data.status_code {
                let duration_ms = data.start.elapsed().as_secs_f64() * 1000.0;
                let _ = self.tx.try_send(MetricEvent::HttpRequest {
                    request_id: data.request_id,
                    method: data.method.clone(),
                    path: data.path.clone(),
                    status_code,
                    duration_ms,
                });
            }
        }
    }
}
