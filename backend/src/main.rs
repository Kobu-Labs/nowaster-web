use std::{env, sync::Arc};

use config::database::{Database, DatabaseTrait};
use dotenv::{dotenv, from_path};
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
    from_path("../../deploy/.env").ok();

    dotenv().ok();
    let port = env::var("BACKEND_PORT").unwrap();
    let database_url = env::var("DATABASE_URL").unwrap();
    let addr = env::var("BACKEND_ADDRESS").unwrap();

    let db = Database::init(database_url)
        .await
        .unwrap_or_else(|e| panic!("Database error: {}", e));

    let router = get_router(Arc::new(db));
    let addr = format!("{}:{}", addr, port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, router).await.unwrap()
}
