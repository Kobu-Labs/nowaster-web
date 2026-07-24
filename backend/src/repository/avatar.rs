use anyhow::Result;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::avatar::write_avatar::{CreateAvatarPresetDto, UpdateAvatarPresetDto},
    entity::avatar::{
        ActivityEntry, AvatarPreset, AvatarTier, CategoryHint, GenerationRun, GenerationStatus,
        Hint, UserAvatar, UserAvatarHistory,
    },
};

// ---------------------------------------------------------------------------
// AvatarPresetRepository
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct AvatarPresetRepository {
    db_conn: Arc<Database>,
}

impl AvatarPresetRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn create(&self, dto: CreateAvatarPresetDto) -> Result<AvatarPreset> {
        let preset = crate::named_query!(
            "avatar_preset_create",
            sqlx::query_as!(
                AvatarPreset,
                r#"
                INSERT INTO avatar_preset (name, thumbnail_url, reference_image_url, is_active)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id, name, thumbnail_url, reference_image_url, leonardo_init_image_id,
                    is_active, created_at as "created_at: DateTime<Utc>"
                "#,
                dto.name,
                dto.thumbnail_url,
                dto.reference_image_url,
                dto.is_active.unwrap_or(true)
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(preset)
    }

    #[instrument(err, skip(self))]
    pub async fn update(&self, id: Uuid, dto: UpdateAvatarPresetDto) -> Result<AvatarPreset> {
        let preset = crate::named_query!(
            "avatar_preset_update",
            sqlx::query_as!(
                AvatarPreset,
                r#"
                UPDATE avatar_preset SET
                    name              = COALESCE($2, name),
                    thumbnail_url     = COALESCE($3, thumbnail_url),
                    reference_image_url = COALESCE($4, reference_image_url),
                    is_active         = COALESCE($5, is_active)
                WHERE id = $1
                RETURNING
                    id, name, thumbnail_url, reference_image_url, leonardo_init_image_id,
                    is_active, created_at as "created_at: DateTime<Utc>"
                "#,
                id,
                dto.name,
                dto.thumbnail_url,
                dto.reference_image_url,
                dto.is_active
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(preset)
    }

    #[instrument(err, skip(self))]
    pub async fn delete(&self, id: Uuid) -> Result<()> {
        crate::named_query!(
            "avatar_preset_delete",
            sqlx::query!("DELETE FROM avatar_preset WHERE id = $1", id)
                .execute(self.db_conn.get_pool())
        )?;
        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn find_by_id(&self, id: Uuid) -> Result<Option<AvatarPreset>> {
        let preset = crate::named_query!(
            "avatar_preset_find_by_id",
            sqlx::query_as!(
                AvatarPreset,
                r#"
                SELECT id, name, thumbnail_url, reference_image_url, leonardo_init_image_id,
                       is_active, created_at as "created_at: DateTime<Utc>"
                FROM avatar_preset WHERE id = $1
                "#,
                id
            )
            .fetch_optional(self.db_conn.get_pool())
        )?;
        Ok(preset)
    }

    #[instrument(err, skip(self))]
    pub async fn list_all(&self) -> Result<Vec<AvatarPreset>> {
        let presets = crate::named_query!(
            "avatar_preset_list_all",
            sqlx::query_as!(
                AvatarPreset,
                r#"
                SELECT id, name, thumbnail_url, reference_image_url, leonardo_init_image_id,
                       is_active, created_at as "created_at: DateTime<Utc>"
                FROM avatar_preset ORDER BY created_at ASC
                "#
            )
            .fetch_all(self.db_conn.get_pool())
        )?;
        Ok(presets)
    }

    #[instrument(err, skip(self), fields(preset_id = %id))]
    pub async fn set_leonardo_init_image_id(
        &self,
        id: Uuid,
        leonardo_id: &str,
    ) -> Result<AvatarPreset> {
        let preset = crate::named_query!(
            "avatar_preset_set_leonardo_id",
            sqlx::query_as!(
                AvatarPreset,
                r#"
                UPDATE avatar_preset SET leonardo_init_image_id = $2
                WHERE id = $1
                RETURNING
                    id, name, thumbnail_url, reference_image_url, leonardo_init_image_id,
                    is_active, created_at as "created_at: DateTime<Utc>"
                "#,
                id,
                leonardo_id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(preset)
    }

    #[instrument(err, skip(self))]
    pub async fn list_active(&self) -> Result<Vec<AvatarPreset>> {
        let presets = crate::named_query!(
            "avatar_preset_list_active",
            sqlx::query_as!(
                AvatarPreset,
                r#"
                SELECT id, name, thumbnail_url, reference_image_url, leonardo_init_image_id,
                       is_active, created_at as "created_at: DateTime<Utc>"
                FROM avatar_preset WHERE is_active = true ORDER BY created_at ASC
                "#
            )
            .fetch_all(self.db_conn.get_pool())
        )?;
        Ok(presets)
    }
}

// ---------------------------------------------------------------------------
// UserAvatarRepository
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct UserAvatarRepository {
    db_conn: Arc<Database>,
}

impl UserAvatarRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn get_by_user_id(&self, user_id: &str) -> Result<Option<UserAvatar>> {
        let avatar = crate::named_query!(
            "user_avatar_get",
            sqlx::query_as!(
                UserAvatar,
                r#"
                SELECT
                    id, user_id, base_preset_id,
                    current_image_url, current_thumb_url,
                    tier as "tier: AvatarTier",
                    is_enabled,
                    last_generated_at as "last_generated_at: DateTime<Utc>",
                    next_generation_at as "next_generation_at: DateTime<Utc>",
                    available_generations,
                    created_at as "created_at: DateTime<Utc>",
                    updated_at as "updated_at: DateTime<Utc>"
                FROM user_avatar WHERE user_id = $1
                "#,
                user_id
            )
            .fetch_optional(self.db_conn.get_pool())
        )?;
        Ok(avatar)
    }

    /// Gets the user's avatar row, creating it with defaults if it doesn't exist.
    #[instrument(err, skip(self))]
    pub async fn upsert(&self, user_id: &str) -> Result<UserAvatar> {
        tracing::info!(user_id, "upsert: executing INSERT ... ON CONFLICT");
        let avatar = crate::named_query!(
            "user_avatar_upsert",
            sqlx::query_as!(
                UserAvatar,
                r#"
                INSERT INTO user_avatar (user_id)
                VALUES ($1)
                ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
                RETURNING
                    id, user_id, base_preset_id,
                    current_image_url, current_thumb_url,
                    tier as "tier: AvatarTier",
                    is_enabled,
                    last_generated_at as "last_generated_at: DateTime<Utc>",
                    next_generation_at as "next_generation_at: DateTime<Utc>",
                    available_generations,
                    created_at as "created_at: DateTime<Utc>",
                    updated_at as "updated_at: DateTime<Utc>"
                "#,
                user_id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        tracing::info!(user_id, id = %avatar.id, "upsert: OK");
        Ok(avatar)
    }

    #[instrument(err, skip(self))]
    pub async fn set_enabled(&self, user_id: &str, enabled: bool) -> Result<UserAvatar> {
        tracing::info!(user_id, enabled, "set_enabled: executing UPDATE");
        let avatar = crate::named_query!(
            "user_avatar_set_enabled",
            sqlx::query_as!(
                UserAvatar,
                r#"
                UPDATE user_avatar SET
                    is_enabled = $2,
                    updated_at = NOW()
                WHERE user_id = $1
                RETURNING
                    id, user_id, base_preset_id,
                    current_image_url, current_thumb_url,
                    tier as "tier: AvatarTier",
                    is_enabled,
                    last_generated_at as "last_generated_at: DateTime<Utc>",
                    next_generation_at as "next_generation_at: DateTime<Utc>",
                    available_generations,
                    created_at as "created_at: DateTime<Utc>",
                    updated_at as "updated_at: DateTime<Utc>"
                "#,
                user_id,
                enabled
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        tracing::info!(user_id, "set_enabled: OK");
        Ok(avatar)
    }

    #[instrument(err, skip(self))]
    pub async fn set_preset(&self, user_id: &str, preset_id: Uuid) -> Result<UserAvatar> {
        let avatar = crate::named_query!(
            "user_avatar_set_preset",
            sqlx::query_as!(
                UserAvatar,
                r#"
                UPDATE user_avatar SET
                    base_preset_id = $2,
                    updated_at = NOW()
                WHERE user_id = $1
                RETURNING
                    id, user_id, base_preset_id,
                    current_image_url, current_thumb_url,
                    tier as "tier: AvatarTier",
                    is_enabled,
                    last_generated_at as "last_generated_at: DateTime<Utc>",
                    next_generation_at as "next_generation_at: DateTime<Utc>",
                    available_generations,
                    created_at as "created_at: DateTime<Utc>",
                    updated_at as "updated_at: DateTime<Utc>"
                "#,
                user_id,
                preset_id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(avatar)
    }

    /// Called after a successful generation to update image URLs. Decrements
    /// `available_generations` unless `consume_quota` is false (admin bypass).
    #[instrument(err, skip(self))]
    pub async fn mark_generated(
        &self,
        user_id: &str,
        image_url: &str,
        thumb_url: &str,
        consume_quota: bool,
    ) -> Result<UserAvatar> {
        let avatar = crate::named_query!(
            "user_avatar_mark_generated",
            sqlx::query_as!(
                UserAvatar,
                r#"
                UPDATE user_avatar SET
                    current_image_url    = $2,
                    current_thumb_url    = $3,
                    last_generated_at    = NOW(),
                    available_generations = CASE WHEN $4
                        THEN GREATEST(available_generations - 1, 0)
                        ELSE available_generations
                    END,
                    updated_at           = NOW()
                WHERE user_id = $1
                RETURNING
                    id, user_id, base_preset_id,
                    current_image_url, current_thumb_url,
                    tier as "tier: AvatarTier",
                    is_enabled,
                    last_generated_at as "last_generated_at: DateTime<Utc>",
                    next_generation_at as "next_generation_at: DateTime<Utc>",
                    available_generations,
                    created_at as "created_at: DateTime<Utc>",
                    updated_at as "updated_at: DateTime<Utc>"
                "#,
                user_id,
                image_url,
                thumb_url,
                consume_quota
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(avatar)
    }

    /// Adds (or subtracts) `amount` from the user's generation balance,
    /// clamped at zero. Used by admin grants.
    #[instrument(err, skip(self))]
    pub async fn admin_grant_generations(&self, user_id: &str, amount: i32) -> Result<UserAvatar> {
        let avatar = crate::named_query!(
            "user_avatar_admin_grant_generations",
            sqlx::query_as!(
                UserAvatar,
                r#"
                UPDATE user_avatar SET
                    available_generations = GREATEST(available_generations + $2, 0),
                    updated_at = NOW()
                WHERE user_id = $1
                RETURNING
                    id, user_id, base_preset_id,
                    current_image_url, current_thumb_url,
                    tier as "tier: AvatarTier",
                    is_enabled,
                    last_generated_at as "last_generated_at: DateTime<Utc>",
                    next_generation_at as "next_generation_at: DateTime<Utc>",
                    available_generations,
                    created_at as "created_at: DateTime<Utc>",
                    updated_at as "updated_at: DateTime<Utc>"
                "#,
                user_id,
                amount
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(avatar)
    }
}

// ---------------------------------------------------------------------------
// GenerationRunRepository
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct GenerationRunRepository {
    db_conn: Arc<Database>,
}

impl GenerationRunRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn create(&self, user_id: &str) -> Result<GenerationRun> {
        let result = crate::named_query!(
            "generation_run_create",
            sqlx::query_as!(
                GenerationRun,
                r#"
                INSERT INTO generation_run (user_id)
                VALUES ($1)
                RETURNING
                    id, user_id,
                    status as "status: GenerationStatus",
                    started_at  as "started_at: DateTime<Utc>",
                    completed_at as "completed_at: DateTime<Utc>",
                    input_data as "input_data: crate::entity::avatar::ActivityData",
                    image_url, thumb_url, error_message, retry_count,
                    created_at as "created_at: DateTime<Utc>"
                "#,
                user_id
            )
            .fetch_one(self.db_conn.get_pool())
        );

        match result {
            Ok(run) => Ok(run),
            Err(sqlx::Error::Database(db_err))
                if db_err.constraint() == Some("generation_run_one_active_per_user") =>
            {
                anyhow::bail!("A generation is already in progress")
            }
            Err(e) => Err(e.into()),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn set_running(&self, id: Uuid) -> Result<GenerationRun> {
        let run = crate::named_query!(
            "generation_run_set_running",
            sqlx::query_as!(
                GenerationRun,
                r#"
                UPDATE generation_run SET
                    status     = 'running',
                    started_at = NOW()
                WHERE id = $1
                RETURNING
                    id, user_id,
                    status as "status: GenerationStatus",
                    started_at  as "started_at: DateTime<Utc>",
                    completed_at as "completed_at: DateTime<Utc>",
                    input_data as "input_data: crate::entity::avatar::ActivityData",
                    image_url, thumb_url, error_message, retry_count,
                    created_at as "created_at: DateTime<Utc>"
                "#,
                id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(run)
    }

    #[instrument(err, skip(self))]
    pub async fn set_success(
        &self,
        id: Uuid,
        image_url: &str,
        thumb_url: &str,
        input_data: &[ActivityEntry],
    ) -> Result<GenerationRun> {
        let input_data = sqlx::types::Json(input_data);
        let run = crate::named_query!(
            "generation_run_set_success",
            sqlx::query_as!(
                GenerationRun,
                r#"
                UPDATE generation_run SET
                    status       = 'success',
                    completed_at = NOW(),
                    image_url    = $2,
                    thumb_url    = $3,
                    input_data   = $4
                WHERE id = $1
                RETURNING
                    id, user_id,
                    status as "status: GenerationStatus",
                    started_at  as "started_at: DateTime<Utc>",
                    completed_at as "completed_at: DateTime<Utc>",
                    input_data as "input_data: crate::entity::avatar::ActivityData",
                    image_url, thumb_url, error_message, retry_count,
                    created_at as "created_at: DateTime<Utc>"
                "#,
                id,
                image_url,
                thumb_url,
                input_data as _
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(run)
    }

    #[instrument(err, skip(self))]
    pub async fn set_failed(&self, id: Uuid, error_message: &str) -> Result<GenerationRun> {
        let run = crate::named_query!(
            "generation_run_set_failed",
            sqlx::query_as!(
                GenerationRun,
                r#"
                UPDATE generation_run SET
                    status        = 'failed',
                    completed_at  = NOW(),
                    error_message = $2,
                    retry_count   = retry_count + 1
                WHERE id = $1
                RETURNING
                    id, user_id,
                    status as "status: GenerationStatus",
                    started_at  as "started_at: DateTime<Utc>",
                    completed_at as "completed_at: DateTime<Utc>",
                    input_data as "input_data: crate::entity::avatar::ActivityData",
                    image_url, thumb_url, error_message, retry_count,
                    created_at as "created_at: DateTime<Utc>"
                "#,
                id,
                error_message
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(run)
    }

    #[instrument(err, skip(self))]
    pub async fn get_latest_for_user(&self, user_id: &str) -> Result<Option<GenerationRun>> {
        let run = crate::named_query!(
            "generation_run_latest",
            sqlx::query_as!(
                GenerationRun,
                r#"
                SELECT
                    id, user_id,
                    status as "status: GenerationStatus",
                    started_at  as "started_at: DateTime<Utc>",
                    completed_at as "completed_at: DateTime<Utc>",
                    input_data as "input_data: crate::entity::avatar::ActivityData",
                    image_url, thumb_url, error_message, retry_count,
                    created_at as "created_at: DateTime<Utc>"
                FROM generation_run
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 1
                "#,
                user_id
            )
            .fetch_optional(self.db_conn.get_pool())
        )?;
        Ok(run)
    }

    #[instrument(err, skip(self))]
    pub async fn list_all_recent(&self, limit: i64) -> Result<Vec<GenerationRun>> {
        let runs = crate::named_query!(
            "generation_run_list_all_recent",
            sqlx::query_as!(
                GenerationRun,
                r#"
                SELECT
                    id, user_id,
                    status as "status: GenerationStatus",
                    started_at  as "started_at: DateTime<Utc>",
                    completed_at as "completed_at: DateTime<Utc>",
                    input_data as "input_data: crate::entity::avatar::ActivityData",
                    image_url, thumb_url, error_message, retry_count,
                    created_at as "created_at: DateTime<Utc>"
                FROM generation_run
                ORDER BY created_at DESC
                LIMIT $1
                "#,
                limit
            )
            .fetch_all(self.db_conn.get_pool())
        )?;
        Ok(runs)
    }

    #[instrument(err, skip(self))]
    pub async fn list_for_user(&self, user_id: &str) -> Result<Vec<GenerationRun>> {
        let runs = crate::named_query!(
            "generation_run_list",
            sqlx::query_as!(
                GenerationRun,
                r#"
                SELECT
                    id, user_id,
                    status as "status: GenerationStatus",
                    started_at  as "started_at: DateTime<Utc>",
                    completed_at as "completed_at: DateTime<Utc>",
                    input_data as "input_data: crate::entity::avatar::ActivityData",
                    image_url, thumb_url, error_message, retry_count,
                    created_at as "created_at: DateTime<Utc>"
                FROM generation_run
                WHERE user_id = $1
                ORDER BY created_at DESC
                "#,
                user_id
            )
            .fetch_all(self.db_conn.get_pool())
        )?;
        Ok(runs)
    }
}

// ---------------------------------------------------------------------------
// UserAvatarHistoryRepository
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct UserAvatarHistoryRepository {
    db_conn: Arc<Database>,
}

impl UserAvatarHistoryRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn insert(
        &self,
        user_id: &str,
        image_url: &str,
        thumb_url: &str,
        generation_run_id: Uuid,
    ) -> Result<UserAvatarHistory> {
        let history = crate::named_query!(
            "user_avatar_history_insert",
            sqlx::query_as!(
                UserAvatarHistory,
                r#"
                INSERT INTO user_avatar_history (user_id, image_url, thumb_url, generation_run_id)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id, user_id, image_url, thumb_url, generation_run_id,
                    generated_at as "generated_at: DateTime<Utc>"
                "#,
                user_id,
                image_url,
                thumb_url,
                generation_run_id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(history)
    }
}

// ---------------------------------------------------------------------------
// HintRepository
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct HintRepository {
    db_conn: Arc<Database>,
}

impl HintRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn create(&self, label: &str) -> Result<Hint> {
        let hint = crate::named_query!(
            "hint_create",
            sqlx::query_as!(
                Hint,
                r#"
                INSERT INTO hint (label)
                VALUES ($1)
                ON CONFLICT (label) DO UPDATE SET label = EXCLUDED.label
                RETURNING id, label, usage_count, created_at as "created_at: DateTime<Utc>"
                "#,
                label
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(hint)
    }

    #[instrument(err, skip(self))]
    pub async fn search(&self, query: &str, limit: i64) -> Result<Vec<Hint>> {
        let hints = crate::named_query!(
            "hint_search",
            sqlx::query_as!(
                Hint,
                r#"
                SELECT id, label, usage_count, created_at as "created_at: DateTime<Utc>"
                FROM hint
                WHERE label ILIKE $1
                ORDER BY usage_count DESC, label ASC
                LIMIT $2
                "#,
                format!("%{}%", query),
                limit
            )
            .fetch_all(self.db_conn.get_pool())
        )?;
        Ok(hints)
    }

    #[instrument(err, skip(self))]
    pub async fn increment_usage(&self, id: Uuid) -> Result<()> {
        crate::named_query!(
            "hint_increment_usage",
            sqlx::query!(
                "UPDATE hint SET usage_count = usage_count + 1 WHERE id = $1",
                id
            )
            .execute(self.db_conn.get_pool())
        )?;
        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn decrement_usage(&self, id: Uuid) -> Result<()> {
        crate::named_query!(
            "hint_decrement_usage",
            sqlx::query!(
                "UPDATE hint SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = $1",
                id
            )
            .execute(self.db_conn.get_pool())
        )?;
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// CategoryHintRepository
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct CategoryHintRepository {
    db_conn: Arc<Database>,
}

impl CategoryHintRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn assign(
        &self,
        category_id: Uuid,
        user_id: &str,
        hint_id: Uuid,
    ) -> Result<CategoryHint> {
        let ch = crate::named_query!(
            "category_hint_assign",
            sqlx::query_as!(
                CategoryHint,
                r#"
                INSERT INTO category_hint (category_id, user_id, hint_id)
                VALUES ($1, $2, $3)
                RETURNING
                    id, category_id, user_id, hint_id,
                    created_at as "created_at: DateTime<Utc>"
                "#,
                category_id,
                user_id,
                hint_id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(ch)
    }

    /// True if this hint is already assigned to a category other than
    /// `category_id` for this user — attaching it here too would make two
    /// categories resolve to the same avatar-generation label.
    #[instrument(err, skip(self))]
    pub async fn is_hint_assigned_elsewhere(
        &self,
        user_id: &str,
        hint_id: Uuid,
        category_id: Uuid,
    ) -> Result<bool> {
        let row = crate::named_query!(
            "category_hint_assigned_elsewhere",
            sqlx::query!(
                r#"
                SELECT EXISTS (
                    SELECT 1 FROM category_hint
                    WHERE user_id = $1 AND hint_id = $2 AND category_id != $3
                ) AS "exists!"
                "#,
                user_id,
                hint_id,
                category_id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(row.exists)
    }

    /// True if this hint's label matches the plain name of another of this
    /// user's categories — same collision as above, via a different route.
    #[instrument(err, skip(self))]
    pub async fn hint_label_matches_other_category_name(
        &self,
        user_id: &str,
        hint_id: Uuid,
        category_id: Uuid,
    ) -> Result<bool> {
        let row = crate::named_query!(
            "category_hint_label_matches_category_name",
            sqlx::query!(
                r#"
                SELECT EXISTS (
                    SELECT 1
                    FROM category c
                    JOIN hint h ON h.label = c.name
                    WHERE c.created_by = $1 AND h.id = $2 AND c.id != $3
                ) AS "exists!"
                "#,
                user_id,
                hint_id,
                category_id
            )
            .fetch_one(self.db_conn.get_pool())
        )?;
        Ok(row.exists)
    }

    #[instrument(err, skip(self))]
    pub async fn remove(&self, category_id: Uuid, user_id: &str, hint_id: Uuid) -> Result<()> {
        crate::named_query!(
            "category_hint_remove",
            sqlx::query!(
                r#"
                DELETE FROM category_hint
                WHERE category_id = $1 AND user_id = $2 AND hint_id = $3
                "#,
                category_id,
                user_id,
                hint_id
            )
            .execute(self.db_conn.get_pool())
        )?;
        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn list_for_category(&self, category_id: Uuid, user_id: &str) -> Result<Vec<Hint>> {
        let hints = crate::named_query!(
            "category_hint_list_for_category",
            sqlx::query_as!(
                Hint,
                r#"
                SELECT h.id, h.label, h.usage_count, h.created_at as "created_at: DateTime<Utc>"
                FROM hint h
                JOIN category_hint ch ON ch.hint_id = h.id
                WHERE ch.category_id = $1 AND ch.user_id = $2
                ORDER BY h.label ASC
                "#,
                category_id,
                user_id
            )
            .fetch_all(self.db_conn.get_pool())
        )?;
        Ok(hints)
    }

    /// Returns all (category_id, hints) pairs for a user. Used to build the avatar page table.
    #[instrument(err, skip(self))]
    pub async fn list_all_for_user(&self, user_id: &str) -> Result<Vec<(Uuid, Hint)>> {
        #[derive(sqlx::FromRow)]
        struct Row {
            category_id: Uuid,
            id: Uuid,
            label: String,
            usage_count: i32,
            created_at: DateTime<Utc>,
        }

        let rows = crate::named_query!(
            "category_hint_list_all_for_user",
            sqlx::query_as!(
                Row,
                r#"
                SELECT
                    ch.category_id,
                    h.id,
                    h.label,
                    h.usage_count,
                    h.created_at as "created_at: DateTime<Utc>"
                FROM category_hint ch
                JOIN hint h ON h.id = ch.hint_id
                WHERE ch.user_id = $1
                ORDER BY ch.category_id, h.label ASC
                "#,
                user_id
            )
            .fetch_all(self.db_conn.get_pool())
        )?;

        let pairs = rows
            .into_iter()
            .map(|r| {
                (
                    r.category_id,
                    Hint {
                        id: r.id,
                        label: r.label,
                        usage_count: r.usage_count,
                        created_at: r.created_at,
                    },
                )
            })
            .collect();

        Ok(pairs)
    }
}
