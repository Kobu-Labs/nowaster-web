pub mod data;
mod guest;
mod npc;

use std::sync::Arc;

use crate::config::database::{Database, DatabaseTrait};

#[derive(Clone)]
pub struct SandboxSeeder {
    db: Arc<Database>,
}

impl SandboxSeeder {
    pub fn new(db: &Arc<Database>) -> Self {
        Self { db: Arc::clone(db) }
    }

    pub async fn seed_npc_users(&self, count: usize) -> Result<Vec<String>, sqlx::Error> {
        npc::seed_npc_users(self.db.get_pool(), count).await
    }

    pub async fn seed_guest_user(
        &self,
        user_id: &str,
        npc_ids: &[String],
    ) -> Result<(), sqlx::Error> {
        guest::seed_guest_user(self.db.get_pool(), user_id, npc_ids).await
    }
}
