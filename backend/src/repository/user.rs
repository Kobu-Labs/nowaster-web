use anyhow::Result;
use std::sync::Arc;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::user::create_user::CreateUserDto,
    entity::user::User,
};

#[derive(Clone)]
pub struct UserRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Debug)]
pub struct ReadUserRow {
    id: String,
    displayname: String,
}

pub trait UserRepositoryTrait {
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn create(&self, dto: CreateUserDto) -> Result<User>;
    fn mapper(&self, row: ReadUserRow) -> User;
}

impl UserRepositoryTrait for UserRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn create(&self, dto: CreateUserDto) -> Result<User> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                    INSERT INTO "user" (id, displayname)
                    VALUES ($1, $2)
                    RETURNING id, displayname
            "#,
            dto.clerk_user_id,
            dto.displayname
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    fn mapper(&self, row: ReadUserRow) -> User {
        User {
            id: row.id,
            username: row.displayname,
        }
    }
}
