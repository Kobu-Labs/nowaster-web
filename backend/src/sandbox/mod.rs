use sqlx::PgPool;
use tracing::{info, warn};

use crate::config::env::AppEnvironment;

pub async fn initialize_sandbox(pool: &PgPool, app_env: &AppEnvironment) {
    if *app_env != AppEnvironment::NowasterSandbox {
        return;
    }

    info!("🏖️  Initializing sandbox environment...");

    match create_guest_user_pool(pool, 100).await {
        Ok(created) => {
            if created > 0 {
                info!("✅ Created {} guest users", created);
            } else {
                info!("✅ Guest user pool already exists");
            }
        }
        Err(e) => {
            warn!("⚠️  Failed to create guest user pool: {}", e);
        }
    }
}

pub async fn create_guest_user_pool(pool: &PgPool, count: usize) -> Result<i64, sqlx::Error> {
    // Find highest existing guest number
    let max_guest_num: Option<i32> = sqlx::query_scalar(
        r#"
        SELECT CAST(SUBSTRING(id FROM 7) AS INTEGER) as guest_num
        FROM "user"
        WHERE id LIKE 'guest_%'
        ORDER BY guest_num DESC
        LIMIT 1
        "#,
    )
    .fetch_optional(pool)
    .await?;

    let start_num = max_guest_num.unwrap_or(0) + 1;

    info!(
        "Creating {} guest users starting from guest_{:03}...",
        count, start_num
    );

    let mut created_count = 0i64;

    for i in 0..count {
        let guest_num = start_num + i as i32;
        let guest_id = format!("guest_{:03}", guest_num);
        let display_name = format!("Guest #{}", guest_num);
        let email = format!("{}@sandbox.nowaster.app", guest_id);

        let result = sqlx::query!(
            r#"
            INSERT INTO "user" (id, displayname, email, role, created_at)
            VALUES ($1, $2, $3, 'user', NOW())
            "#,
            guest_id,
            display_name,
            email
        )
        .execute(pool)
        .await?;

        if result.rows_affected() > 0 {
            created_count += 1;
        }
    }

    Ok(created_count)
}
