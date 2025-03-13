use async_trait::async_trait;
use sqlx::{Error, PgPool};

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
        let pool = sqlx::postgres::PgPool::connect(database_url.as_str()).await?;
        sqlx::migrate!("./migrations").run(&pool).await?;

        Ok(Self { pool })
    }

    fn get_pool(&self) -> &PgPool {
        &self.pool
    }
}
