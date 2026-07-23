use once_cell::sync::Lazy;
use std::{
    collections::VecDeque,
    sync::{Arc, Mutex},
};
use tracing::{info, warn};
use uuid::Uuid;

use crate::{
    config::{database::Database, env::AppEnvironment},
    entity::sandbox_lifecycle::SandboxLifecycle,
    repository::sandbox_lifecycle::SandboxLifecycleRepository,
    seeding::{config::SandboxConfig, SandboxSeeder},
    service::notification_service::NotificationService,
};

static GUEST_POOL: Lazy<Mutex<VecDeque<(String, String)>>> =
    Lazy::new(|| Mutex::new(VecDeque::new()));

#[derive(Clone)]
pub struct SandboxService {
    lifecycle_repo: SandboxLifecycleRepository,
    seeder: SandboxSeeder,
    notification_service: NotificationService,
}

impl SandboxService {
    pub fn new(database: &Arc<Database>) -> Self {
        Self {
            lifecycle_repo: SandboxLifecycleRepository::new(database),
            seeder: SandboxSeeder::new(database),
            notification_service: NotificationService::new(database),
        }
    }

    pub async fn get_all_lifecycles(
        &self,
        limit: i64,
    ) -> Result<Vec<SandboxLifecycle>, sqlx::Error> {
        self.lifecycle_repo.get_all(limit).await
    }

    pub async fn increment_unique_users(&self) -> Result<(), sqlx::Error> {
        if let Some(active) = self.lifecycle_repo.get_active().await? {
            self.lifecycle_repo
                .increment_unique_users(active.id)
                .await?;
        }
        Ok(())
    }

    pub async fn perform_reset(
        &self,
        triggered_by: &str,
        triggered_type: &str,
    ) -> Result<(), sqlx::Error> {
        self.cycle(triggered_by, triggered_type).await
    }

    pub async fn initialize_sandbox(&self, app_env: &AppEnvironment) {
        if *app_env != AppEnvironment::NowasterSandbox {
            return;
        }
        info!("🏖️  Initializing sandbox environment...");
        if let Err(e) = self.cycle("system", "startup").await {
            warn!("⚠️  Sandbox initialization failed: {}", e);
        }
    }

    pub fn is_pool_empty(&self) -> bool {
        GUEST_POOL.lock().unwrap().is_empty()
    }

    pub fn pop_guest_from_pool(&self) -> Option<(String, String)> {
        GUEST_POOL.lock().unwrap().pop_front()
    }

    pub fn load_pool(&self, entries: Vec<(String, String)>) {
        let mut pool = GUEST_POOL.lock().unwrap();
        pool.clear();
        for entry in entries {
            pool.push_back(entry);
        }
        info!("Initialized guest pool with {} users", pool.len());
    }

    pub async fn replenish_pool_if_needed(&self) -> Result<(), sqlx::Error> {
        let current_size = GUEST_POOL.lock().unwrap().len();

        if current_size < SandboxConfig::GUEST_POOL_REPLENISH_THRESHOLD {
            info!(
                "Guest pool below threshold ({} < {}), replenishing...",
                current_size,
                SandboxConfig::GUEST_POOL_REPLENISH_THRESHOLD
            );

            let guests = self
                .lifecycle_repo
                .create_guest_user_pool(SandboxConfig::GUEST_POOL_REPLENISH_BATCH_SIZE)
                .await?;

            if !guests.is_empty() {
                let npc_ids = self.lifecycle_repo.get_npc_ids().await.unwrap_or_default();
                for (guest_id, _) in &guests {
                    if let Err(e) = self.seeder.seed_guest_user(guest_id, &npc_ids).await {
                        warn!("⚠️  Failed to seed replenished guest {}: {}", guest_id, e);
                    }
                }
                info!("✅ Created and seeded {} new guest users", guests.len());
                let mut pool = GUEST_POOL.lock().unwrap();
                for entry in guests {
                    pool.push_back(entry);
                }
            }
        }

        Ok(())
    }

    /// Seeds a handful of demo communities on top of whatever users already
    /// exist. Reused both by the full sandbox reset cycle below (so the
    /// public sandbox demo showcases communities) and by an admin-triggered
    /// endpoint for populating a local/dev database without touching
    /// anything else. `extra_member_id`, when given, is folded in as a
    /// member/owner so a real logged-in user can see the seeded data.
    pub async fn seed_demo_communities(
        &self,
        extra_member_id: Option<&str>,
    ) -> Result<Vec<Uuid>, sqlx::Error> {
        let mut member_ids = self.lifecycle_repo.get_npc_ids().await?;

        if member_ids.len() < 2 {
            let needed = SandboxConfig::NPC_COUNT
                .saturating_sub(member_ids.len())
                .max(2);
            let mut new_npc_ids = self.seeder.seed_npc_users(needed).await?;
            member_ids.append(&mut new_npc_ids);
        }

        if let Some(id) = extra_member_id {
            if !member_ids.iter().any(|m| m == id) {
                member_ids.push(id.to_string());
            }
        }

        self.seeder.seed_communities(&member_ids).await
    }

    async fn cycle(&self, triggered_by: &str, triggered_type: &str) -> Result<(), sqlx::Error> {
        let current_id = self.lifecycle_repo.get_active().await?.map(|l| l.id);
        self.lifecycle_repo
            .teardown_and_reset(current_id, triggered_by, triggered_type)
            .await?;

        let new_lifecycle = self
            .lifecycle_repo
            .create(triggered_by, triggered_type)
            .await?;

        let seed_result: Result<(), sqlx::Error> = async {
            let npc_ids = self.seeder.seed_npc_users(SandboxConfig::NPC_COUNT).await?;

            let guests = self
                .lifecycle_repo
                .create_guest_user_pool(SandboxConfig::GUEST_POOL_INITIAL_SIZE)
                .await?;

            for (guest_id, _) in &guests {
                if let Err(e) = self.seeder.seed_guest_user(guest_id, &npc_ids).await {
                    warn!("⚠️  Failed to seed guest {}: {}", guest_id, e);
                }
            }

            let community_member_ids: Vec<String> = npc_ids
                .iter()
                .cloned()
                .chain(guests.iter().map(|(guest_id, _)| guest_id.clone()))
                .collect();
            if let Err(e) = self.seeder.seed_communities(&community_member_ids).await {
                warn!("⚠️  Failed to seed demo communities: {}", e);
            }

            self.lifecycle_repo.activate(new_lifecycle.id).await?;
            self.load_pool(guests);
            Ok(())
        }
        .await;

        if let Err(ref e) = seed_result {
            warn!("⚠️  Seeding failed, marking lifecycle as failed: {}", e);
            let _ = self.lifecycle_repo.mark_failed(new_lifecycle.id).await;
            let _ = self
                .notification_service
                .notify_admins_sandbox_failed_deploy(new_lifecycle.id)
                .await;
        }

        seed_result
    }
}
