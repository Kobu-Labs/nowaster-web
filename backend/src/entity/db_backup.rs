use chrono::{DateTime, Utc};
use sqlx::FromRow;

#[derive(Debug, Clone, FromRow)]
pub struct DbBackup {
    pub id: i32,
    pub trigger_by: String,
    pub trigger_type: String,
    pub backup_file: String,
    pub backup_size_bytes: Option<i64>,
    pub status: String,
    pub error_message: Option<String>,
    pub started_at: Option<DateTime<Utc>>,
    pub finished_at: Option<DateTime<Utc>>,
    pub duration_seconds: Option<i32>,
    // User information (when trigger_type = 'user')
    // Option because of LEFT JOIN - NULL when no matching user
    pub user_username: Option<String>,
    pub user_avatar_url: Option<String>,
}
