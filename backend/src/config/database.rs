use async_trait::async_trait;
use sqlx::postgres::PgConnectOptions;
use sqlx::{ConnectOptions, Error, PgPool};

pub struct Database {
    pool: PgPool,
}

#[async_trait]
pub trait DatabaseTrait {
    async fn init(database_url: String) -> Result<Self, Error>
    where
        Self: Sized;
    fn get_pool(&self) -> &PgPool;
}

#[async_trait]
impl DatabaseTrait for Database {
    async fn init(database_url: String) -> Result<Self, Error> {
        let opts = database_url
            .parse::<PgConnectOptions>()?
            .log_statements(log::LevelFilter::Debug);

        let pool = sqlx::postgres::PgPoolOptions::new()
            .connect_with(opts)
            .await?;
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }

    fn get_pool(&self) -> &PgPool {
        &self.pool
    }
}
