use std::{path::Path, sync::Arc};

use config::database::{Database, DatabaseTrait};
use router::root::get_router;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::config::env::Config;

mod auth;
mod config;
mod dto;
mod entity;
mod metrics;
mod repository;
mod router;
mod seeding;
mod service;

use metrics::{metrics_worker, MetricEvent, MetricsLayer};

#[tokio::main]
async fn main() {
    let log_level = "info,sqlx=debug";

    dotenv::dotenv().ok();
    dotenv::from_path(Path::new(".env.keys")).ok();
    let config = envy::from_env::<Config>()
        .unwrap_or_else(|e| panic!("Failed to load configuration from environment: {}", e));

    println!("🔧 [CONFIG] Loaded configuration successfully");
    println!(
        "🔧 [CONFIG] Server: {}:{}",
        config.server.address, config.server.port
    );
    println!("🔧 [CONFIG] Frontend URL: {}", config.frontend.url);

    let (metrics_tx, metrics_rx) = tokio::sync::mpsc::channel::<MetricEvent>(10_000);

    tracing_subscriber::registry()
        .with(fmt::layer().json().with_current_span(false))
        .with(EnvFilter::new(log_level))
        .with(MetricsLayer::new(metrics_tx))
        .init();

    let db = Database::init(config.database.connection_url.clone())
        .await
        .unwrap_or_else(|e| panic!("Database error: {}", e));

    let pool = db.get_pool().clone();
    tokio::spawn(metrics_worker(metrics_rx, pool));

    let router = get_router(Arc::new(db), Arc::new(config.clone())).await;
    let addr = format!("{}:{}", config.server.address, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    println!(
        "🚀 [SERVER] Listening on {}",
        listener.local_addr().unwrap()
    );
    axum::serve(listener, router).await.unwrap()
}
