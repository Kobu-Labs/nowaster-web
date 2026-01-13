use anyhow::Result;
use std::sync::Arc;
use tracing::instrument;

use crate::{config::database::{Database, DatabaseTrait}, entity::db_backup::DbBackup};

#[derive(Clone)]
pub struct DbBackupRepository {
    db_conn: Arc<Database>,
}

impl DbBackupRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: db_conn.clone(),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn get_all(&self) -> Result<Vec<DbBackup>> {
        let backups = sqlx::query_as!(
            DbBackup,
            r#"
            SELECT
                db.id,
                db.trigger_by,
                db.trigger_type,
                db.backup_file,
                db.backup_size_gb,
                db.status,
                db.error_message,
                db.started_at,
                db.finished_at,
                db.duration_seconds,
                u.displayname as user_username,
                u.avatar_url as user_avatar_url
            FROM db_backups db
            LEFT JOIN "user" u ON db.trigger_type = 'user' AND db.trigger_by = u.id
            ORDER BY db.started_at DESC
            "#
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(backups)
    }

    #[instrument(err, skip(self))]
    pub async fn get_by_id(&self, id: i32) -> Result<Option<DbBackup>> {
        let backup = sqlx::query_as!(
            DbBackup,
            r#"
            SELECT
                db.id,
                db.trigger_by,
                db.trigger_type,
                db.backup_file,
                db.backup_size_gb,
                db.status,
                db.error_message,
                db.started_at,
                db.finished_at,
                db.duration_seconds,
                u.displayname as user_username,
                u.avatar_url as user_avatar_url
            FROM db_backups db
            LEFT JOIN "user" u ON db.trigger_type = 'user' AND db.trigger_by = u.id
            WHERE db.id = $1
            "#,
            id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(backup)
    }
}
