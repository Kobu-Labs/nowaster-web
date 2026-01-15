use std::sync::Arc;

use axum::{
    http::{self, Request},
    routing::IntoMakeService,
    Router,
};
use uuid::Uuid;

use crate::{
    config::database::Database,
    repository::{
        category::{CategoryRepository, CategoryRepositoryTrait},
        feed::FeedRepository,
        fixed_session::{FixedSessionRepository, SessionRepositoryTrait},
        friends::FriendsRepository,
        project::{ProjectRepository, ProjectRepositoryTrait},
        session_template::RecurringSessionRepository,
        statistics::sessions::StatisticsRepository,
        stopwatch_session::StopwatchSessionRepository,
        tag::TagRepository,
        task::{TaskRepository, TaskRepositoryTrait},
        user::UserRepository,
    },
    router::user::root::protected_user_router,
    service::{
        auth_service::AuthService,
        category_service::CategoryService,
        feed::{
            events::FeedEventService, reactions::FeedReactionService,
            subscriptions::FeedSubscriptionService, visibility::FeedVisibilityService,
        },
        friend_service::{FriendService, FriendServiceTrait},
        notification_service::NotificationService,
        project_service::ProjectService,
        release_service::ReleaseService,
        session::{fixed::FixedSessionService, stopwatch::StopwatchSessionService},
        session_template::SessionTemplateService,
        statistics_service::StatisticsService,
        tag_service::TagService,
        task_service::TaskService,
        user_service::UserService,
    },
};

use super::{
    admin::routes::admin_router, auth::auth_router, category::root::category_router,
    feed::root::feed_router, friend::root::friend_router, notification::root::notification_router,
    project::root::project_router, release::routes::release_router, session::root::session_router,
    statistics::root::statistics_router, tag::root::tag_router, task::root::task_router,
};

use tracing::info_span;

#[derive(Clone)]
pub struct Feed {
    pub visibility_service: FeedVisibilityService,
    pub reaction_service: FeedReactionService,
    pub event_service: FeedEventService,
    pub subscription_service: FeedSubscriptionService,
}

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<crate::Config>,
    pub auth_service: AuthService,
    pub session_service: FixedSessionService,
    pub stopwatch_service: StopwatchSessionService,
    pub tag_service: TagService,
    pub category_service: CategoryService,
    pub user_service: UserService,
    pub statistics_service: StatisticsService,
    pub friend_service: Arc<dyn FriendServiceTrait + Send + Sync>,
    pub session_template_service: SessionTemplateService,
    pub notification_service: NotificationService,
    pub release_service: ReleaseService,
    pub project_service: ProjectService,
    pub task_service: TaskService,
    pub db_backup_repo: crate::repository::db_backup::DbBackupRepository,
    pub s3_client: aws_sdk_s3::Client,
    pub feed: Feed,
}

pub async fn get_router(db: Arc<Database>, config: Arc<crate::Config>) -> IntoMakeService<Router> {
    let category_repo = CategoryRepository::new(&db);
    let tag_repo = TagRepository::new(&db);
    let session_repo = FixedSessionRepository::new(&db);
    let user_repo = UserRepository::new(&db);
    let statistics_repo = StatisticsRepository::new(&db);
    let friend_repo = FriendsRepository::new(&db);
    let stopwatch_repo = StopwatchSessionRepository::new(&db);
    let template_session_repo = RecurringSessionRepository::new(&db);
    let feed_repo = FeedRepository::new(&db);
    let project_repo = ProjectRepository::new(&db);
    let task_repo = TaskRepository::new(&db);
    let db_backup_repo = crate::repository::db_backup::DbBackupRepository::new(&db);

    // Initialize S3 client
    use aws_config::BehaviorVersion;
    use aws_sdk_s3::config::Builder as S3ConfigBuilder;

    let aws_config = aws_config::defaults(BehaviorVersion::latest())
        .region(aws_config::Region::new(config.s3.region.clone()))
        .endpoint_url(&config.s3.endpoint_url)
        .load()
        .await;

    let s3_config = S3ConfigBuilder::from(&aws_config)
        .force_path_style(true)
        .build();

    let s3_client = aws_sdk_s3::Client::from_conf(s3_config);

    let auth_service = AuthService::new(&db);
    let category_service = CategoryService::new(category_repo.clone());
    let tag_service = TagService::new(tag_repo, category_repo.clone());
    let statistics_service = StatisticsService::new(statistics_repo);

    let notification_service = NotificationService::new(&db);
    let release_service = ReleaseService::new(&db);

    // feed related services
    let visibility_service = FeedVisibilityService::new(feed_repo.clone());
    let event_service = FeedEventService::new(feed_repo.clone());
    let subscription_service = FeedSubscriptionService::new(feed_repo.clone(), user_repo.clone());

    let user_service = UserService::new(
        user_repo.clone(),
        visibility_service.clone(),
        subscription_service.clone(),
    );

    let session_service = FixedSessionService::new(
        session_repo.clone(),
        stopwatch_repo.clone(),
        event_service.clone(),
        user_service.clone(),
        project_repo.clone(),
        task_repo.clone(),
    );

    let task_service = TaskService::new(
        task_repo.clone(),
        project_repo.clone(),
        event_service.clone(),
        user_service.clone(),
    );

    let project_service = ProjectService::new(
        project_repo,
        event_service.clone(),
        user_service.clone(),
        task_service.clone(),
        session_service.clone(),
    );
    let reaction_service = FeedReactionService::new(
        feed_repo.clone(),
        notification_service.clone(),
        session_repo.clone(),
    );
    let friend_service = FriendService::new(
        friend_repo,
        visibility_service.clone(),
        subscription_service.clone(),
        notification_service.clone(),
    );
    let stopwatch_service =
        StopwatchSessionService::new(category_service.clone(), stopwatch_repo.clone());
    let session_template_service =
        SessionTemplateService::new(template_session_repo, session_repo.clone());

    let state = AppState {
        config: config.clone(),
        auth_service,
        friend_service: Arc::new(friend_service),
        session_service,
        tag_service,
        category_service,
        user_service,
        statistics_service,
        stopwatch_service,
        session_template_service,
        notification_service,
        release_service,
        project_service,
        task_service,
        db_backup_repo,
        s3_client,
        feed: Feed {
            subscription_service,
            visibility_service,
            event_service,
            reaction_service,
        },
    };

    // Auth routes (public)
    let auth_routes = Router::new()
        .nest("/auth", auth_router())
        .with_state(state.clone());

    // Protected routes (Actor extractor validates JWT)
    let protected_routes = Router::new()
        .nest("/user", protected_user_router().with_state(state.clone()))
        .nest("/session", session_router().with_state(state.clone()))
        .nest("/tag", tag_router().with_state(state.clone()))
        .nest("/category", category_router().with_state(state.clone()))
        .nest("/statistics", statistics_router().with_state(state.clone()))
        .nest("/friends", friend_router().with_state(state.clone()))
        .nest("/feed", feed_router().with_state(state.clone()))
        .nest(
            "/notifications",
            notification_router().with_state(state.clone()),
        )
        .nest("/releases", release_router().with_state(state.clone()))
        .nest("/admin", admin_router().with_state(state.clone()))
        .nest("/task", task_router().with_state(state.clone()))
        .nest("/project", project_router().with_state(state.clone()));

    let api_router = Router::new().merge(auth_routes).merge(protected_routes);

    // Configure CORS to allow credentials from frontend
    // Note: When using allow_credentials(true), cannot use wildcards for origin/headers
    let frontend_url = &config.frontend.url;

    println!("🌐 [CORS] Allowing origin: {}", frontend_url);

    let cors = tower_http::cors::CorsLayer::new()
        .allow_origin(frontend_url.parse::<http::HeaderValue>().unwrap())
        .allow_methods([
            http::Method::GET,
            http::Method::POST,
            http::Method::PUT,
            http::Method::DELETE,
            http::Method::PATCH,
            http::Method::OPTIONS,
        ])
        .allow_headers([
            http::header::CONTENT_TYPE,
            http::header::AUTHORIZATION,
            http::header::ACCEPT,
            http::header::COOKIE,
            http::HeaderName::from_static("x-api-key"),
            http::HeaderName::from_static("x-impersonation-token"),
        ])
        .allow_credentials(true);

    Router::new()
        .nest("/api", api_router)
        .layer(cors)
        .into_make_service()
}

fn make_span_for_request<B>(req: &Request<B>) -> tracing::Span {
    let request_id = Uuid::new_v4();
    info_span!(
        "http_request",
        method = %req.method(),
        uri = %req.uri(),
        request_id = %request_id
    )
}
