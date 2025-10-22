use std::{path::Path, sync::Arc};

use config::database::{Database, DatabaseTrait};
use router::root::get_router;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::config::env::Config;

mod auth;
mod config;
mod dto;
mod entity;
mod repository;
mod router;
mod service;

#[tokio::main]
async fn main() {
    let log_level = if cfg!(debug_assertions) {
        "info"
    } else {
        "info"
    };

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

    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::new(log_level))
        .init();

    let db = Database::init(config.database.connection_url.clone())
        .await
        .unwrap_or_else(|e| panic!("Database error: {}", e));

    let router = get_router(Arc::new(db), Arc::new(config.clone()));
    let addr = format!("{}:{}", config.server.address, config.server.port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    println!(
        "🚀 [SERVER] Listening on {}",
        listener.local_addr().unwrap()
    );
    axum::serve(listener, router).await.unwrap()
}
