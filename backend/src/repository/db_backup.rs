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
                id,
                trigger_by,
                trigger_type,
                backup_file,
                backup_size_gb,
                status,
                error_message,
                started_at,
                finished_at,
                duration_seconds
            FROM db_backups
            ORDER BY started_at DESC
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
                id,
                trigger_by,
                trigger_type,
                backup_file,
                backup_size_gb,
                status,
                error_message,
                started_at,
                finished_at,
                duration_seconds
            FROM db_backups
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(self.db_conn.get_pool())
        .await?;

        Ok(backup)
    }
}
