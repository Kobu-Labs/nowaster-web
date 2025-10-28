use anyhow::Result;
use serde_json::Value;
use sqlx::{QueryBuilder, Row};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::release::{CreateReleaseDto, ReleaseListQueryDto, UpdateReleaseDto},
    entity::release::{Release, ReleaseUser},
};

#[derive(Clone)]
pub struct ReleaseRepository {
    db: Arc<Database>,
}

impl ReleaseRepository {
    pub fn new(db: &Arc<Database>) -> Self {
        Self { db: Arc::clone(db) }
    }

    #[instrument(err, skip(self))]
    pub async fn create_release(&self, dto: CreateReleaseDto) -> Result<Uuid> {
        let id = Uuid::new_v4();
        let tags_json = serde_json::to_value(&dto.tags)?;

        sqlx::query!(
            r#"
                INSERT INTO release (id, version, name, short_description, tags, seo_title, seo_description, seo_keywords)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            id,
            dto.version,
            dto.name,
            dto.short_description,
            tags_json,
            dto.seo_title,
            dto.seo_description,
            dto.seo_keywords
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(id)
    }

    #[instrument(err, skip(self))]
    pub async fn get_release_by_id(&self, release_id: Uuid) -> Result<Option<Release>> {
        let row = sqlx::query!(
            r#"
                SELECT r.id, r.version, r.name, r.short_description, r.released, r.released_at,
                       r.released_by, r.tags, r.seo_title, r.seo_description, r.seo_keywords,
                       r.created_at, r.updated_at,
                       u.id as "user_id?", u.displayname as "user_username?", u.avatar_url as "user_avatar_url?"
                FROM release r
                LEFT JOIN "user" u ON r.released_by = u.id
                WHERE r.id = $1
            "#,
            release_id
        )
        .fetch_optional(self.db.get_pool())
        .await?;

        Ok(row.map(|r| Release {
            id: r.id,
            version: r.version,
            name: r.name,
            short_description: r.short_description,
            released: r.released,
            released_at: r.released_at.map(|dt| dt.into()),
            released_by: r.user_id.map(|user_id| ReleaseUser {
                id: user_id,
                username: r.user_username.unwrap_or_default(),
                avatar_url: r.user_avatar_url,
            }),
            tags: serde_json::from_value(r.tags).unwrap_or_default(),
            seo_title: r.seo_title,
            seo_description: r.seo_description,
            seo_keywords: r.seo_keywords,
            created_at: r.created_at.into(),
            updated_at: r.updated_at.into(),
        }))
    }

    #[instrument(err, skip(self))]
    pub async fn get_release_by_version(&self, version: String) -> Result<Option<Release>> {
        let row = sqlx::query!(
            r#"
                SELECT r.id, r.version, r.name, r.short_description, r.released, r.released_at,
                       r.released_by, r.tags, r.seo_title, r.seo_description, r.seo_keywords,
                       r.created_at, r.updated_at,
                       u.id as "user_id?", u.displayname as "user_username?", u.avatar_url as "user_avatar_url?"
                FROM release r
                LEFT JOIN "user" u ON r.released_by = u.id
                WHERE r.version = $1
            "#,
            version
        )
        .fetch_optional(self.db.get_pool())
        .await?;

        Ok(row.map(|r| Release {
            id: r.id,
            version: r.version,
            name: r.name,
            short_description: r.short_description,
            released: r.released,
            released_at: r.released_at.map(|dt| dt.into()),
            released_by: r.user_id.map(|user_id| ReleaseUser {
                id: user_id,
                username: r.user_username.unwrap_or_default(),
                avatar_url: r.user_avatar_url,
            }),
            tags: serde_json::from_value(r.tags).unwrap_or_default(),
            seo_title: r.seo_title,
            seo_description: r.seo_description,
            seo_keywords: r.seo_keywords,
            created_at: r.created_at.into(),
            updated_at: r.updated_at.into(),
        }))
    }

    #[instrument(err, skip(self))]
    pub async fn list_releases(&self, query: ReleaseListQueryDto) -> Result<Vec<Release>> {
        let mut qb = QueryBuilder::new(
            "SELECT r.id, r.version, r.name, r.short_description, r.released, r.released_at,
                    r.released_by, r.tags, r.seo_title, r.seo_description, r.seo_keywords,
                    r.created_at, r.updated_at,
                    u.id as user_id, u.displayname as user_username, u.avatar_url as user_avatar_url
             FROM release r
             LEFT JOIN \"user\" u ON r.released_by = u.id",
        );

        if query.released_only.unwrap_or(false) {
            qb.push(" WHERE r.released = ");
            qb.push_bind(true);
        }

        qb.push(" ORDER BY r.released_at DESC NULLS LAST, r.created_at DESC");

        if let Some(limit) = query.limit {
            qb.push(" LIMIT ");
            qb.push_bind(limit);
        }

        if let Some(offset) = query.offset {
            qb.push(" OFFSET ");
            qb.push_bind(offset);
        }

        let rows = qb.build().fetch_all(self.db.get_pool()).await?;

        let releases = rows
            .into_iter()
            .map(|row| {
                let user_id: Option<String> = row.try_get("user_id").ok();
                let user_username: Option<String> = row.try_get("user_username").ok();
                let user_avatar_url: Option<String> = row.try_get("user_avatar_url").ok();

                Ok(Release {
                    id: row.try_get("id")?,
                    version: row.try_get("version")?,
                    name: row.try_get("name")?,
                    short_description: row.try_get("short_description")?,
                    released: row.try_get("released")?,
                    released_at: row
                        .try_get::<Option<chrono::DateTime<chrono::Utc>>, _>("released_at")?
                        .map(|dt| dt.into()),
                    released_by: user_id.map(|uid| ReleaseUser {
                        id: uid,
                        username: user_username.unwrap_or_default(),
                        avatar_url: user_avatar_url,
                    }),
                    tags: serde_json::from_value(row.try_get::<Value, _>("tags")?)
                        .unwrap_or_default(),
                    seo_title: row.try_get("seo_title")?,
                    seo_description: row.try_get("seo_description")?,
                    seo_keywords: row.try_get("seo_keywords")?,
                    created_at: row
                        .try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")?
                        .into(),
                    updated_at: row
                        .try_get::<chrono::DateTime<chrono::Utc>, _>("updated_at")?
                        .into(),
                })
            })
            .collect::<Result<Vec<_>>>()?;

        Ok(releases)
    }

    #[instrument(err, skip(self))]
    pub async fn update_release(&self, release_id: Uuid, dto: UpdateReleaseDto) -> Result<bool> {
        let result = sqlx::query!(
            r#"
                UPDATE release
                SET version = COALESCE($2, version),
                    name = COALESCE($3, name),
                    short_description = COALESCE($4, short_description),
                    tags = COALESCE($5, tags),
                    seo_title = COALESCE($6, seo_title),
                    seo_description = COALESCE($7, seo_description),
                    seo_keywords = COALESCE($8, seo_keywords)
                WHERE id = $1
            "#,
            release_id,
            dto.version,
            dto.name,
            dto.short_description,
            dto.tags.map(|t| serde_json::to_value(t).unwrap()),
            dto.seo_title,
            dto.seo_description,
            dto.seo_keywords
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected() > 0)
    }

    #[instrument(err, skip(self))]
    pub async fn publish_release(&self, release_id: Uuid, released_by: String) -> Result<bool> {
        let result = sqlx::query!(
            r#"
                UPDATE release
                SET released = true,
                    released_at = NOW(),
                    released_by = $2
                WHERE id = $1 AND released = false
            "#,
            release_id,
            released_by
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected() > 0)
    }

    #[instrument(err, skip(self))]
    pub async fn unpublish_release(&self, release_id: Uuid) -> Result<bool> {
        let result = sqlx::query!(
            r#"
                UPDATE release
                SET released = false,
                    released_at = NULL,
                    released_by = NULL
                WHERE id = $1
            "#,
            release_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected() > 0)
    }

    #[instrument(err, skip(self))]
    pub async fn delete_release(&self, release_id: Uuid) -> Result<bool> {
        let result = sqlx::query!(
            r#"
                DELETE FROM release WHERE id = $1
            "#,
            release_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected() > 0)
    }

    #[instrument(err, skip(self))]
    pub async fn get_latest_released(&self) -> Result<Option<Release>> {
        let row = sqlx::query!(
            r#"
                SELECT r.id, r.version, r.name, r.short_description, r.released, r.released_at,
                       r.released_by, r.tags, r.seo_title, r.seo_description, r.seo_keywords,
                       r.created_at, r.updated_at,
                       u.id as "user_id?", u.displayname as "user_username?", u.avatar_url as "user_avatar_url?"
                FROM release r
                LEFT JOIN "user" u ON r.released_by = u.id
                WHERE r.released = true
                ORDER BY r.released_at DESC
                LIMIT 1
            "#
        )
        .fetch_optional(self.db.get_pool())
        .await?;

        Ok(row.map(|r| Release {
            id: r.id,
            version: r.version,
            name: r.name,
            short_description: r.short_description,
            released: r.released,
            released_at: r.released_at.map(|dt| dt.into()),
            released_by: r.user_id.map(|user_id| ReleaseUser {
                id: user_id,
                username: r.user_username.unwrap_or_default(),
                avatar_url: r.user_avatar_url,
            }),
            tags: serde_json::from_value(r.tags).unwrap_or_default(),
            seo_title: r.seo_title,
            seo_description: r.seo_description,
            seo_keywords: r.seo_keywords,
            created_at: r.created_at.into(),
            updated_at: r.updated_at.into(),
        }))
    }

    #[instrument(err, skip(self))]
    pub async fn mark_release_seen(&self, release_id: Uuid, user_id: String) -> Result<()> {
        sqlx::query!(
            r#"
                INSERT INTO seen_release (release_id, user_id)
                VALUES ($1, $2)
                ON CONFLICT (release_id, user_id) DO NOTHING
            "#,
            release_id,
            user_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn has_user_seen_release(&self, release_id: Uuid, user_id: String) -> Result<bool> {
        let result = sqlx::query!(
            r#"
                SELECT EXISTS(
                    SELECT 1 FROM seen_release
                    WHERE release_id = $1 AND user_id = $2
                ) as "exists!"
            "#,
            release_id,
            user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(result.exists)
    }

    #[instrument(err, skip(self))]
    pub async fn mark_older_releases_seen(&self, release_id: Uuid, user_id: String) -> Result<u64> {
        // Mark all older released releases as seen
        let result = sqlx::query!(
            r#"
                INSERT INTO seen_release (release_id, user_id)
                SELECT r.id, $2::VARCHAR
                FROM release r
                WHERE r.released = true
                  AND r.id != $1
                  AND r.released_at < (SELECT released_at FROM release WHERE id = $1)
                ON CONFLICT (release_id, user_id) DO NOTHING
            "#,
            release_id,
            user_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(result.rows_affected())
    }
}
