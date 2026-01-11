use chrono::{DateTime, Utc};
use sqlx::{types::BigDecimal, FromRow};

#[derive(Debug, Clone, FromRow)]
pub struct DbBackup {
    pub id: i32,
    pub trigger_by: String,
    pub trigger_type: String,
    pub backup_file: String,
    pub backup_size_gb: Option<BigDecimal>,
    pub status: String,
    pub error_message: Option<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
}
