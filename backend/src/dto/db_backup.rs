use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::entity::db_backup::DbBackup;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReadDbBackupDto {
    pub id: i32,
    pub trigger_by: String,
    pub trigger_type: String,
    pub backup_file: String,
    pub backup_size_gb: Option<String>,
    pub status: String,
    pub error_message: Option<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
}

impl From<DbBackup> for ReadDbBackupDto {
    fn from(backup: DbBackup) -> Self {
        Self {
            id: backup.id,
            trigger_by: backup.trigger_by,
            trigger_type: backup.trigger_type,
            backup_file: backup.backup_file,
            backup_size_gb: backup.backup_size_gb.map(|v| v.to_string()),
            status: backup.status,
            error_message: backup.error_message,
            started_at: backup.started_at,
            finished_at: backup.finished_at,
            duration_seconds: backup.duration_seconds,
        }
    }
}
