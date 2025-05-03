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
pub struct UserRow {
    pub id: String,
    pub displayname: String,
}

pub fn map_user_row(row: UserRow) -> User {
    User {
        id: row.id,
        username: row.displayname,
    }
}

pub trait UserRepositoryTrait {
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn create(&self, dto: CreateUserDto) -> Result<User>;
    async fn get_user_by_username(&self, username: String) -> Result<User>;
    fn mapper(&self, row: UserRow) -> User;
}

impl UserRepositoryTrait for UserRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn get_user_by_username(&self, username: String) -> Result<User> {
        let row = sqlx::query_as!(
            UserRow,
            r#"
                SELECT id, displayname
                FROM "user"
                WHERE displayname = $1
            "#,
            username
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    async fn create(&self, dto: CreateUserDto) -> Result<User> {
        let row = sqlx::query_as!(
            UserRow,
            r#"
                    INSERT INTO "user" (id, displayname)
                    VALUES ($1, $2)
                    RETURNING id, displayname
            "#,
            dto.id,
            dto.username
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    fn mapper(&self, row: UserRow) -> User {
        map_user_row(row)
    }
}
