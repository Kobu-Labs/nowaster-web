use once_cell::sync::Lazy;
use std::{
    collections::VecDeque,
    sync::{Arc, Mutex},
};
use tracing::{info, warn};

use crate::{
    config::{database::Database, env::AppEnvironment},
    entity::sandbox_lifecycle::SandboxLifecycle,
    repository::sandbox_lifecycle::SandboxLifecycleRepository,
    seeding::SandboxSeeder,
};

static GUEST_POOL: Lazy<Mutex<VecDeque<(String, String)>>> =
    Lazy::new(|| Mutex::new(VecDeque::new()));

#[derive(Clone)]
pub struct SandboxService {
    lifecycle_repo: SandboxLifecycleRepository,
    seeder: SandboxSeeder,
}

impl SandboxService {
    pub fn new(database: &Arc<Database>) -> Self {
        Self {
            lifecycle_repo: SandboxLifecycleRepository::new(database),
            seeder: SandboxSeeder::new(database),
        }
    }

    pub async fn create_lifecycle(
        &self,
        created_by: &str,
        created_type: &str,
    ) -> Result<SandboxLifecycle, sqlx::Error> {
        self.lifecycle_repo.create(created_by, created_type).await
    }

    pub async fn get_active_lifecycle(&self) -> Result<Option<SandboxLifecycle>, sqlx::Error> {
        self.lifecycle_repo.get_active().await
    }

    pub async fn increment_unique_users(&self) -> Result<(), sqlx::Error> {
        if let Some(active) = self.lifecycle_repo.get_active().await? {
            self.lifecycle_repo
                .increment_unique_users(active.id)
                .await?;
        }
        Ok(())
    }

    pub async fn teardown_active_lifecycle(
        &self,
        torndown_by: &str,
        torndown_type: &str,
    ) -> Result<(), sqlx::Error> {
        if let Some(active) = self.lifecycle_repo.get_active().await? {
            self.lifecycle_repo
                .teardown(active.id, torndown_by, torndown_type)
                .await?;
        }
        Ok(())
    }

    pub async fn upsert_lifecycle(
        &self,
        id: uuid::Uuid,
        status: &str,
        created_by: &str,
        created_type: &str,
        torndown_by: Option<&str>,
        torndown_type: Option<&str>,
        unique_users: i32,
        started_at: chrono::DateTime<chrono::Utc>,
        ended_at: Option<chrono::DateTime<chrono::Utc>>,
    ) -> Result<(), sqlx::Error> {
        self.lifecycle_repo
            .upsert_lifecycle(
                id,
                status,
                created_by,
                created_type,
                torndown_by,
                torndown_type,
                unique_users,
                started_at,
                ended_at,
            )
            .await
    }

    pub async fn get_all_lifecycles(
        &self,
        limit: i64,
    ) -> Result<Vec<SandboxLifecycle>, sqlx::Error> {
        self.lifecycle_repo.get_all(limit).await
    }

    pub async fn seed_npc_users(&self) -> Result<Vec<String>, sqlx::Error> {
        self.seeder.seed_npc_users(10).await
    }

    pub async fn initialize_sandbox(&self, app_env: &AppEnvironment) {
        if *app_env != AppEnvironment::NowasterSandbox {
            return;
        }

        info!("🏖️  Initializing sandbox environment...");

        match self.get_active_lifecycle().await {
            Ok(None) => {
                if let Err(e) = self.create_lifecycle("system", "startup").await {
                    warn!("⚠️  Failed to create initial lifecycle: {}", e);
                } else {
                    info!("✅ Created initial sandbox lifecycle");
                }
            }
            Ok(Some(_)) => {
                info!("✅ Active lifecycle already exists");
            }
            Err(e) => {
                warn!("⚠️  Failed to check lifecycle: {}", e);
            }
        }

        let npc_ids = match self.lifecycle_repo.get_npc_ids().await {
            Ok(ids) if ids.is_empty() => {
                match self.seeder.seed_npc_users(10).await {
                    Ok(ids) => {
                        info!("✅ Created {} NPC users", ids.len());
                        ids
                    }
                    Err(e) => {
                        warn!("⚠️  Failed to seed NPC users: {}", e);
                        vec![]
                    }
                }
            }
            Ok(ids) => {
                info!("✅ {} NPC users already exist", ids.len());
                ids
            }
            Err(e) => {
                warn!("⚠️  Failed to check NPC users: {}", e);
                vec![]
            }
        };

        match self.lifecycle_repo.create_guest_user_pool(100).await {
            Ok(guest_ids) => {
                if !guest_ids.is_empty() {
                    info!("✅ Created {} guest users, seeding data...", guest_ids.len());
                    for guest_id in &guest_ids {
                        if let Err(e) = self.seeder.seed_guest_user(guest_id, &npc_ids).await {
                            warn!("⚠️  Failed to seed guest {}: {}", guest_id, e);
                        }
                    }
                    info!("✅ Guest seeding complete");
                } else {
                    info!("✅ Guest user pool already exists");
                }
            }
            Err(e) => {
                warn!("⚠️  Failed to create guest user pool: {}", e);
            }
        }

        if let Err(e) = self.init_pool().await {
            warn!("⚠️  Failed to initialize guest pool cache: {}", e);
        }
    }

    pub async fn reset_sandbox(&self) -> Result<(), sqlx::Error> {
        info!("🔄 Resetting sandbox - truncating all tables...");
        self.lifecycle_repo.reset_sandbox().await?;
        info!("✅ Sandbox database reset to clean slate - all tables truncated");
        Ok(())
    }

    pub async fn reinitialize_guest_pool(&self) -> Result<usize, sqlx::Error> {
        let guest_ids = self.lifecycle_repo.create_guest_user_pool(100).await?;
        let count = guest_ids.len();

        if !guest_ids.is_empty() {
            let npc_ids = self.lifecycle_repo.get_npc_ids().await.unwrap_or_default();
            for guest_id in &guest_ids {
                if let Err(e) = self.seeder.seed_guest_user(guest_id, &npc_ids).await {
                    warn!("⚠️  Failed to seed guest {}: {}", guest_id, e);
                }
            }
        }

        Ok(count)
    }

    pub fn is_pool_empty(&self) -> bool {
        let pool = GUEST_POOL.lock().unwrap();
        pool.is_empty()
    }

    pub fn pop_guest_from_pool(&self) -> Option<(String, String)> {
        let mut pool = GUEST_POOL.lock().unwrap();
        pool.pop_front()
    }

    pub async fn init_pool(&self) -> Result<(), sqlx::Error> {
        let entries = self.lifecycle_repo.get_guest_pool_entries().await?;

        let mut guest_pool = GUEST_POOL.lock().unwrap();
        guest_pool.clear();
        for entry in entries {
            guest_pool.push_back(entry);
        }

        info!("Initialized guest pool with {} users", guest_pool.len());
        Ok(())
    }

    pub async fn replenish_pool_if_needed(&self) -> Result<(), sqlx::Error> {
        const REPLENISH_THRESHOLD: usize = 50;
        const REPLENISH_BATCH_SIZE: usize = 100;

        let current_size = {
            let pool = GUEST_POOL.lock().unwrap();
            pool.len()
        };

        if current_size < REPLENISH_THRESHOLD {
            info!(
                "Guest pool below threshold ({} < {}), replenishing...",
                current_size, REPLENISH_THRESHOLD
            );

            let guest_ids = self
                .lifecycle_repo
                .create_guest_user_pool(REPLENISH_BATCH_SIZE)
                .await?;

            if !guest_ids.is_empty() {
                let npc_ids = self.lifecycle_repo.get_npc_ids().await.unwrap_or_default();
                for guest_id in &guest_ids {
                    if let Err(e) = self.seeder.seed_guest_user(guest_id, &npc_ids).await {
                        warn!("⚠️  Failed to seed replenished guest {}: {}", guest_id, e);
                    }
                }
                info!("✅ Created and seeded {} new guest users", guest_ids.len());
            }

            self.init_pool().await?;
        }

        Ok(())
    }
}
