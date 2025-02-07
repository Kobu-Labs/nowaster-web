use std::sync::Arc;

use config::database::{Database, DatabaseTrait};
use dotenv::dotenv;
use router::root::get_router;

mod config;
mod dto;
mod entity;
mod repository;
mod router;
mod service;
mod state;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let db = Database::init()
        .await
        .unwrap_or_else(|e| panic!("Database error: {}", e));

    let router = get_router(Arc::new(db));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3030")
        .await
        .unwrap();

    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, router).await.unwrap()
}
