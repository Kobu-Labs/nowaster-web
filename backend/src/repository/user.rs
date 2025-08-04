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
    avatar_url: Option<String>,
}

#[derive(Debug, Default)]
pub struct FilterUsersDto {
    pub id: Option<IdFilter>,
    pub name: Option<String>,
}

#[derive(Debug)]
pub enum IdFilter {
    Many(Vec<String>),
    Single(String),
}

impl UserRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    pub async fn create(&self, dto: CreateUserDto) -> Result<User> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                    INSERT INTO "user" (id, displayname, avatar_url)
                    VALUES ($1, $2, $3)
                    RETURNING id, displayname, avatar_url
            "#,
            dto.id,
            dto.username,
            dto.avatar_url
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    pub async fn update(&self, dto: UpdateUserDto) -> Result<User> {
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

        if let Some(avatar_url) = dto.avatar_url {
            query.push(" avatarUrl = ");
            query.push_bind(avatar_url);
            should_execute = true;
        }

        query.push(" WHERE id = ");
        query.push_bind(dto.id);
        query.push(" RETURNING id, displayname, avatar_url");

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
            avatar_url: row.avatar_url,
        }
    }

    pub async fn upsert(&self, dto: CreateUserDto) -> Result<Option<User>> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                INSERT INTO "user" (id, displayname)
                VALUES ($1, $2)
                ON CONFLICT (id) DO NOTHING
                RETURNING id, displayname, avatar_url
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

    pub async fn filter_users(&self, filter: FilterUsersDto) -> Result<Vec<User>> {
        if filter.id.is_none() && filter.name.is_none() {
            return Ok(vec![]);
        }

        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                SELECT id, displayname, avatar_url
                FROM "user"
                WHERE 1=1
            "#,
        );

        if let Some(id) = filter.id {
            match id {
                IdFilter::Many(ids) => {
                    query.push(" AND id = ANY(").push_bind(ids).push(")");
                }
                IdFilter::Single(single) => {
                    query.push(" AND id = ").push_bind(single);
                }
            }
        }

        if let Some(name) = filter.name {
            query.push("WHERE displayname = ").push_bind(name);
        }

        let rows = query
            .build_query_as::<ReadUserRow>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        let users = rows.into_iter().map(|row| self.mapper(row)).collect();
        Ok(users)
    }
}
