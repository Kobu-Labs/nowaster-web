use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Clone, Debug)]
pub struct BlockRule {
    pub id: Uuid,
    pub pattern: String,
    pub created_at: DateTime<Utc>,
}
