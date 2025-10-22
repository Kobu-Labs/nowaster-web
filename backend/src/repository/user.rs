use anyhow::Result;
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use tracing::instrument;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::user::{update_user::UpdateUserDto, update_visibility::UpdateVisibilityDto},
    entity::{user::User, visibility::VisibilityFlags},
    router::clerk::{Actor, UserRole},
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
    visibility_flags: VisibilityFlags,
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

    #[instrument(err, skip(self))]
    pub async fn update(&self, dto: UpdateUserDto) -> Result<User> {
        let result = sqlx::query_as!(
            ReadUserRow,
            r#"
                UPDATE "user" u SET
                    displayname = COALESCE($1, u.displayname),
                    avatar_url = COALESCE($2, u.avatar_url)
                WHERE u.id = $3
                RETURNING u.id, u.displayname, u.avatar_url, u.visibility_flags
            "#,
            dto.username,
            dto.avatar_url,
            dto.id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(result))
    }

    fn mapper(&self, row: ReadUserRow) -> User {
        User {
            id: row.id,
            username: row.displayname,
            avatar_url: row.avatar_url,
            visibility_flags: row.visibility_flags,
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor_id))]
    pub async fn get_actor_by_id(&self, actor_id: String) -> Result<Option<(Actor, String)>> {
        let query = sqlx::query!(
            r#"
                SELECT
                    u.id,
                    u.displayname,
                    u.role AS "role: UserRole"
                FROM "user" u
                WHERE
                    u.id = $1
            "#,
            actor_id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(query.map(|q| {
            (
                Actor {
                    user_id: q.id.clone(),
                    role: q.role,
                },
                q.displayname,
            )
        }))
    }
    #[instrument(err, skip(self))]
    pub async fn filter_users(&self, filter: FilterUsersDto) -> Result<Vec<User>> {
        if filter.id.is_none() && filter.name.is_none() {
            return Ok(vec![]);
        }

        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            r#"
                SELECT id, displayname, avatar_url, visibility_flags
                FROM "user"
                WHERE
            "#,
        );

        let mut separated = query.separated(" OR ");

        if let Some(id) = filter.id {
            match id {
                IdFilter::Many(ids) => {
                    separated
                        .push("id = ANY(")
                        .push_bind_unseparated(ids)
                        .push_unseparated(")");
                }
                IdFilter::Single(single) => {
                    let pattern = format!("%{}%", single);
                    separated.push("id ILIKE ").push_bind_unseparated(pattern);
                }
            }
        }

        if let Some(name) = filter.name {
            let pattern = format!("%{}%", name);
            separated
                .push("displayname ILIKE ")
                .push_bind_unseparated(pattern);
        }

        let rows = query
            .build_query_as::<ReadUserRow>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        let users = rows.into_iter().map(|row| self.mapper(row)).collect();
        Ok(users)
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn update_visibility(
        &self,
        user_id: String,
        dto: UpdateVisibilityDto,
    ) -> Result<User> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                UPDATE "user"
                SET visibility_flags = $1
                WHERE id = $2
                RETURNING id, displayname, avatar_url, visibility_flags
            "#,
            dto.visibility_flags.as_raw(),
            user_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn get_by_id(&self, user_id: String) -> Result<Option<User>> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                SELECT id, displayname, avatar_url, visibility_flags
                FROM "user"
                WHERE id = $1
            "#,
            user_id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        match row {
            Some(row) => Ok(Some(self.mapper(row))),
            None => Ok(None),
        }
    }

    /// Find user by email address
    #[instrument(err, skip(self))]
    pub async fn find_by_email(&self, email: &str) -> Result<Option<User>> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                SELECT id, displayname, avatar_url, visibility_flags
                FROM "user"
                WHERE email = $1
            "#,
            email
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        match row {
            Some(row) => Ok(Some(self.mapper(row))),
            None => Ok(None),
        }
    }

    /// Create user from OAuth profile
    #[instrument(err, skip(self))]
    pub async fn create_from_oauth(
        &self,
        id: String,
        email: String,
        display_name: String,
        avatar_url: Option<String>,
    ) -> Result<User> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                INSERT INTO "user" (id, displayname, email, avatar_url, visibility_flags)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, displayname, avatar_url, visibility_flags
            "#,
            id,
            display_name,
            email,
            avatar_url,
            VisibilityFlags::default().as_raw()
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    /// Upsert user from OAuth (create or update if exists by email)
    #[instrument(err, skip(self))]
    pub async fn upsert_from_oauth(
        &self,
        email: &str,
        display_name: &str,
        avatar_url: Option<&str>,
    ) -> Result<User> {
        let row = sqlx::query_as!(
            ReadUserRow,
            r#"
                INSERT INTO "user" (id, displayname, email, avatar_url, visibility_flags)
                VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
                ON CONFLICT (email)
                DO UPDATE SET
                    displayname = EXCLUDED.displayname,
                    avatar_url = EXCLUDED.avatar_url
                RETURNING id, displayname, avatar_url, visibility_flags
            "#,
            display_name,
            email,
            avatar_url,
            VisibilityFlags::default().as_raw()
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }
}
