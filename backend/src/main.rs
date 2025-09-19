use std::{env, sync::Arc};

use clerk_rs::{clerk::Clerk, ClerkConfiguration};
use config::database::{Database, DatabaseTrait};
use router::root::get_router;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use tracing_appender::{non_blocking, rolling};

mod config;
mod dto;
mod entity;
mod repository;
mod router;
mod service;

#[tokio::main]
async fn main() {
    let log_level = if cfg!(debug_assertions) {
        "debug"
    } else {
        "info"
    };

    // Create logs directory
    use std::fs;
    fs::create_dir_all("logs").ok();

    if cfg!(debug_assertions) {
        // Development: Pretty console logs + JSON file logs
        let file_appender = rolling::daily("logs", "app.log");
        let (file_writer, _guard) = non_blocking(file_appender);

        let console_layer = fmt::layer()
            .pretty()
            .with_target(true)
            .with_thread_ids(true)
            .with_file(true)
            .with_line_number(true);

        let file_layer = fmt::layer()
            .json()
            .with_writer(file_writer)
            .with_current_span(false)
            .with_span_list(true);

        tracing_subscriber::registry()
            .with(console_layer)
            .with(file_layer)
            .with(EnvFilter::new(log_level))
            .init();

        // Keep the guard alive
        std::mem::forget(_guard);
    } else {
        // Production: JSON logs only to stdout
        let fmt_layer = fmt::layer()
            .json()
            .with_current_span(false)
            .with_span_list(true);

        tracing_subscriber::registry()
            .with(fmt_layer)
            .with(EnvFilter::new(log_level))
            .init();
    }

    #[cfg(debug_assertions)]
    {
        dotenv::dotenv().ok();
    }

    let port = env::var("BACKEND_PORT").unwrap_or("4005".to_string());
    let database_url = env::var("DATABASE_URL")
        .unwrap_or("postgres://devuser:devpass@localhost:5432/postgres".to_string());
    let addr = env::var("BACKEND_ADDRESS").unwrap_or("localhost".to_string());
    let clerk_secret = env::var("CLERK_SECRET_KEY").unwrap();

    tracing::info!(
        port = %port,
        address = %addr,
        database_url = %database_url.replace(&env::var("POSTGRES_PASSWORD").unwrap_or_default(), "***"),
        "Starting Nowaster backend server"
    );

    let db = Database::init(database_url)
        .await
        .unwrap_or_else(|e| {
            tracing::error!(error = %e, "Failed to initialize database");
            panic!("Database error: {}", e)
        });

    tracing::info!("Database connection established successfully");

    let clerk_config = ClerkConfiguration::new(None, None, Some(clerk_secret), None);
    let clerk = Clerk::new(clerk_config);

    let router = get_router(Arc::new(db), clerk);
    let addr = format!("{}:{}", addr, port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    tracing::info!(
        address = %listener.local_addr().unwrap(),
        "Server listening and ready to accept connections"
    );

    axum::serve(listener, router).await.unwrap()
}
