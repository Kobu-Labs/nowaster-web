use std::sync::Arc;

use sqlx::PgPool;

use crate::{
    config::{
        database::{Database, DatabaseTrait},
        env::AppEnvironment,
    },
    seeding::{guest, SandboxSeeder},
};

const KOBU_USER_ID: &str = "5518f4a4-58c6-48fa-9fa4-e299779d29d0";
const KOBU_DISPLAY_NAME: &str = "Kobu";
const KOBU_EMAIL: &str = "thekobu@gmail.com";
const KOBU_AVATAR_URL: &str =
    "https://lh3.googleusercontent.com/a/ACg8ocIgwgHCqwPwESkMPiitvPNS90OEwbgdX44LGX14uVLpd9aL9ls=s96-c";
const DEV_NPC_COUNT: usize = 6;

/// Recreates the real Kobu admin account plus a batch of npc users and
/// realistic categories/tags/projects/sessions for it, so a local dev
/// database wiped by a migration reset can be repopulated with something to
/// look at instead of starting empty. OAuth login re-links to this row by
/// email (see auth_service.rs), so no oauth_accounts row needs seeding.
pub async fn run(db: &Arc<Database>, app_env: &AppEnvironment) {
    if *app_env != AppEnvironment::NowasterLocal {
        eprintln!(
            "seed-dev refuses to run outside nowaster-local (APP_ENV={})",
            app_env.as_str()
        );
        std::process::exit(1);
    }

    let pool = db.get_pool();
    upsert_kobu_user(pool)
        .await
        .expect("failed to upsert Kobu user");

    let seeder = SandboxSeeder::new(db);
    let npc_ids = seeder
        .seed_npc_users(DEV_NPC_COUNT)
        .await
        .expect("failed to seed npc users");
    guest::seed_guest_user(pool, KOBU_USER_ID, &npc_ids)
        .await
        .expect("failed to seed dev data for Kobu");

    println!(
        "✅ [SEED-DEV] Seeded Kobu ({}) + {} npc users with sample data",
        KOBU_EMAIL, DEV_NPC_COUNT
    );
}

async fn upsert_kobu_user(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO "user" (id, displayname, email, role, avatar_url)
           VALUES ($1, $2, $3, 'admin', $4)
           ON CONFLICT (id) DO UPDATE SET
               displayname = EXCLUDED.displayname,
               email = EXCLUDED.email,
               role = EXCLUDED.role,
               avatar_url = EXCLUDED.avatar_url"#,
    )
    .bind(KOBU_USER_ID)
    .bind(KOBU_DISPLAY_NAME)
    .bind(KOBU_EMAIL)
    .bind(KOBU_AVATAR_URL)
    .execute(pool)
    .await?;
    Ok(())
}
