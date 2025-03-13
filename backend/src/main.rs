use std::{env, sync::Arc};

use clerk_rs::{clerk::Clerk, ClerkConfiguration};
use config::database::{Database, DatabaseTrait};
use router::root::get_router;

mod config;
mod dto;
mod entity;
mod repository;
mod router;
mod service;

#[tokio::main]
async fn main() {
    #[cfg(debug_assertions)]
    {
        dotenv::dotenv().ok();
    }

    let port = env::var("BACKEND_PORT").unwrap_or("4005".to_string());
    let database_url = env::var("DATABASE_URL")
        .unwrap_or("postgres://devuser:devpass@localhost:5432/postgres".to_string());
    let addr = env::var("BACKEND_ADDRESS").unwrap_or("localhost".to_string());
    let clerk_secret = env::var("CLERK_SECRET_KEY").unwrap();

    let db = Database::init(database_url)
        .await
        .unwrap_or_else(|e| panic!("Database error: {}", e));

    let clerk_config = ClerkConfiguration::new(None, None, Some(clerk_secret), None);
    let clerk = Clerk::new(clerk_config);

    let router = get_router(Arc::new(db), clerk);
    let addr = format!("{}:{}", addr, port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();

    tracing::debug!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, router).await.unwrap()
}
