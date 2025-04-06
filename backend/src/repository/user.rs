use anyhow::Result;
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::user::{create_user::CreateUserDto, update_user::UpdateUserDto},
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
    async fn update(&self, dto: UpdateUserDto) -> Result<User>;
    fn new(db_conn: &Arc<Database>) -> Self;
    async fn create(&self, dto: CreateUserDto) -> Result<User>;
    async fn upsert(&self, dto: CreateUserDto) -> Result<Option<User>>;
    async fn get_user_by_username(&self, username: String) -> Result<User>;
    fn mapper(&self, row: ReadUserRow) -> User;
}

impl UserRepositoryTrait for UserRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    async fn get_user_by_username(&self, username: String) -> Result<User> {
        let row = sqlx::query_as!(
            ReadUserRow,
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
            ReadUserRow,
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

    async fn update(&self, dto: UpdateUserDto) -> Result<User> {
        let mut should_execute = false;
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                UPDATE "user" SET
            "#,
        );

        if let Some(displayname) = dto.username {
            if displayname.is_empty() {
                return Err(anyhow::anyhow!("Display name cannot be empty"));
            }
            query.push(" displayname = ");
            query.push_bind(displayname);
            should_execute = true;
        }
        query.push(" WHERE id = ");
        query.push_bind(dto.id);
        query.push(" RETURNING id, displayname");

        if !should_execute {
            return Err(anyhow::anyhow!("No fields to update"));
        }

        let row = query
            .build_query_as::<ReadUserRow>()
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

    async fn upsert(&self, dto: CreateUserDto) -> Result<Option<User>> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                INSERT INTO "user" (id, displayname)
                VALUES ($1, $2)
                ON CONFLICT (id) DO NOTHING
                RETURNING id, displayname
            "#,
            dto.id,
            dto.username
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        match row {
            Some(row) => {
                let user = self.mapper(row);
                Ok(Some(user))
            }
            None => Ok(None),
        }
    }
}
