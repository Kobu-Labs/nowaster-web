use std::sync::Arc;

use axum::{routing::IntoMakeService, Router};
use clerk_rs::{
    clerk::Clerk,
    validators::{axum::ClerkLayer, jwks::MemoryCacheJwksProvider},
};
use tower::ServiceBuilder;
use tower_http::trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer};

use crate::{
    config::database::Database,
    repository::{
        category::{CategoryRepository, CategoryRepositoryTrait},
        fixed_session::{FixedSessionRepository, SessionRepositoryTrait},
        statistics::sessions::StatisticsRepository,
        tag::{TagRepository, TagRepositoryTrait},
        user::{UserRepository, UserRepositoryTrait},
    },
    service::{
        category_service::CategoryService, session_service::SessionService,
        statistics_service::StatisticsService, tag_service::TagService, user_service::UserService,
    },
};

use super::{
    category::root::category_router, session::root::session_router,
    statistics::root::statistics_router, tag::root::tag_router, user::root::user_router,
};

use tracing::Level;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

#[derive(Clone)]
pub struct AppState {
    pub session_service: SessionService,
    pub tag_service: TagService,
    pub category_service: CategoryService,
    pub user_service: UserService,
    pub statistics_service: StatisticsService,
}

pub fn get_router(db: Arc<Database>, clerk: Clerk) -> IntoMakeService<Router> {
    let category_repo = CategoryRepository::new(&db);
    let tag_repo = TagRepository::new(&db);
    let session_repo = FixedSessionRepository::new(&db);
    let user_repo = UserRepository::new(&db);
    let statistics_repo = StatisticsRepository::new(&db);

    let category_service = CategoryService::new(category_repo.clone());
    let user_service = UserService::new(user_repo.clone());
    let tag_service = TagService::new(tag_repo, category_repo.clone());
    let session_service =
        SessionService::new(session_repo, category_service.clone(), tag_service.clone());
    let statistics_service = StatisticsService::new(statistics_repo);

    let state = AppState {
        session_service,
        tag_service,
        category_service,
        user_service,
        statistics_service,
    };

    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::new("info"))
        .init();

    let user_route = Router::new().nest("/user", user_router().with_state(state.clone()));

    let protected_routes = Router::new()
        .nest("/session", session_router().with_state(state.clone()))
        .nest("/tag", tag_router().with_state(state.clone()))
        .nest("/category", category_router().with_state(state.clone()))
        .nest("/statistics", statistics_router().with_state(state.clone()))
        .layer(ClerkLayer::new(
            MemoryCacheJwksProvider::new(clerk),
            None,
            false,
        ));

    let api_router = Router::new().merge(user_route).merge(protected_routes);

    Router::new()
        .nest("/api", api_router)
        .layer(tower_http::cors::CorsLayer::permissive())
        .layer(
            ServiceBuilder::new().layer(
                TraceLayer::new_for_http()
                    .make_span_with(DefaultMakeSpan::new().level(Level::INFO))
                    .on_request(DefaultOnRequest::new().level(Level::INFO))
                    .on_response(DefaultOnResponse::new().level(Level::INFO)),
            ),
        )
        .into_make_service()
}
