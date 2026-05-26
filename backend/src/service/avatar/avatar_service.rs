use anyhow::{Context, Result};
use chrono::{DateTime, Duration, Utc};
use std::{collections::HashMap, sync::Arc};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::avatar::{
        read_avatar::{
            ReadAvatarPresetDto, ReadGenerationRunDto, ReadUserAvatarDto, ReadUserAvatarHistoryDto,
        },
        write_avatar::{AdminGenerationSource, CreateAvatarPresetDto, UpdateAvatarPresetDto},
    },
    repository::avatar::{
        AvatarPresetRepository, CategoryHintRepository, GenerationRunRepository, HintRepository,
        UserAvatarHistoryRepository, UserAvatarRepository,
    },
    service::avatar::generator::{generate_avatar, upload_avatar_images},
    Config,
};

// ---------------------------------------------------------------------------
// Tier helpers — extend here when paid tier is implemented
// ---------------------------------------------------------------------------

fn regen_interval(_tier: &str) -> Duration {
    Duration::weeks(1)
}

fn data_window(_tier: &str) -> Duration {
    Duration::weeks(1)
}

// ---------------------------------------------------------------------------
// AvatarService
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct AvatarService {
    db: Arc<Database>,
    avatar_repo: UserAvatarRepository,
    run_repo: GenerationRunRepository,
    history_repo: UserAvatarHistoryRepository,
    hint_repo: HintRepository,
    category_hint_repo: CategoryHintRepository,
    preset_repo: AvatarPresetRepository,
    s3_client: aws_sdk_s3::Client,
    config: Arc<Config>,
}

impl AvatarService {
    pub fn new(db: &Arc<Database>, s3_client: aws_sdk_s3::Client, config: Arc<Config>) -> Self {
        Self {
            db: Arc::clone(db),
            avatar_repo: UserAvatarRepository::new(db),
            run_repo: GenerationRunRepository::new(db),
            history_repo: UserAvatarHistoryRepository::new(db),
            hint_repo: HintRepository::new(db),
            category_hint_repo: CategoryHintRepository::new(db),
            preset_repo: AvatarPresetRepository::new(db),
            s3_client,
            config,
        }
    }

    // -----------------------------------------------------------------------
    // Session aggregation
    // -----------------------------------------------------------------------

    #[instrument(err, skip(self))]
    async fn aggregate_input_data(
        &self,
        user_id: &str,
        window_start: DateTime<Utc>,
    ) -> Result<String> {
        struct Row {
            category_name: String,
            total_hours: f64,
            hint_label: Option<String>,
        }

        let rows = sqlx::query_as!(
            Row,
            r#"
            WITH category_hours AS (
                SELECT
                    s.category_id,
                    c.name AS category_name,
                    EXTRACT(EPOCH FROM SUM(s.end_time - s.start_time)) / 3600.0 AS total_hours
                FROM session s
                JOIN category c ON c.id = s.category_id
                WHERE s.user_id = $1
                  AND s.end_time IS NOT NULL
                  AND s.start_time >= $2
                GROUP BY s.category_id, c.name
            )
            SELECT
                ch.category_name,
                ch.total_hours AS "total_hours!: f64",
                h.label AS hint_label
            FROM category_hours ch
            LEFT JOIN category_hint c_hint
                ON c_hint.category_id = ch.category_id AND c_hint.user_id = $1
            LEFT JOIN hint h ON h.id = c_hint.hint_id
            ORDER BY ch.category_name, h.label
            "#,
            user_id,
            window_start
        )
        .fetch_all(self.db.get_pool())
        .await?;

        let mut categories: HashMap<String, (f64, Vec<String>)> = HashMap::new();
        for row in rows {
            let entry = categories
                .entry(row.category_name)
                .or_insert((row.total_hours, Vec::new()));
            if let Some(label) = row.hint_label {
                entry.1.push(label);
            }
        }

        let mut parts: Vec<String> = Vec::new();
        for (category_name, (total_hours, hints)) in &categories {
            let hours = (total_hours * 10.0).round() / 10.0;
            if hints.is_empty() {
                parts.push(format!("{}:{}", category_name, hours));
            } else {
                for hint in hints {
                    parts.push(format!("{}:{}", hint, hours));
                }
            }
        }
        parts.sort();

        Ok(parts.join(","))
    }

    // -----------------------------------------------------------------------
    // Core generation pipeline
    // -----------------------------------------------------------------------

    async fn run_generation_pipeline(
        &self,
        user_id: &str,
        input_data: &str,
        tier: &str,
    ) -> Result<(Uuid, String, String)> {
        let run = self.run_repo.create(user_id).await?;
        let run_id = run.id;

        self.run_repo.set_running(run_id).await?;

        // TODO: fetch base_character_url from user_avatar.base_preset_id → avatar_preset.reference_image_url
        // TODO: fetch template_image_url from config or preset
        let image_bytes = generate_avatar("", "", input_data)
            .await
            .context("Image generation failed")?;

        let (image_url, thumb_url) = upload_avatar_images(
            &self.s3_client,
            &self.config.s3.bucket_name,
            &self.config.s3.endpoint_url,
            user_id,
            image_bytes,
        )
        .await
        .context("S3 upload failed")?;

        self.run_repo
            .set_success(run_id, &image_url, &thumb_url, input_data)
            .await?;

        let next_generation_at = Utc::now() + regen_interval(tier);

        self.avatar_repo
            .mark_generated(user_id, &image_url, &thumb_url, next_generation_at)
            .await?;

        self.history_repo
            .insert(user_id, &image_url, &thumb_url, run_id)
            .await?;

        Ok((run_id, image_url, thumb_url))
    }

    // -----------------------------------------------------------------------
    // User-facing operations
    // -----------------------------------------------------------------------

    #[instrument(err, skip(self))]
    pub async fn get_avatar(&self, user_id: &str) -> Result<Option<ReadUserAvatarDto>> {
        let avatar = self.avatar_repo.get_by_user_id(user_id).await?;
        Ok(avatar.map(ReadUserAvatarDto::from))
    }

    #[instrument(err, skip(self))]
    pub async fn enable(&self, user_id: &str) -> Result<ReadUserAvatarDto> {
        let avatar = self.avatar_repo.upsert(user_id).await?;
        let tier = format!("{:?}", avatar.tier).to_lowercase();

        let updated = self
            .avatar_repo
            .set_enabled(user_id, true, Some(Utc::now()))
            .await?;

        let window_start = Utc::now() - data_window(&tier);
        let input_data = self.aggregate_input_data(user_id, window_start).await?;

        if let Err(e) = self.run_generation_pipeline(user_id, &input_data, &tier).await {
            tracing::error!(user_id, "Immediate generation on enable failed: {}", e);
        }

        Ok(ReadUserAvatarDto::from(updated))
    }

    #[instrument(err, skip(self))]
    pub async fn disable(&self, user_id: &str) -> Result<ReadUserAvatarDto> {
        self.avatar_repo.upsert(user_id).await?;
        let updated = self.avatar_repo.set_enabled(user_id, false, None).await?;
        Ok(ReadUserAvatarDto::from(updated))
    }

    #[instrument(err, skip(self))]
    pub async fn set_preset(&self, user_id: &str, preset_id: Uuid) -> Result<ReadUserAvatarDto> {
        self.preset_repo
            .find_by_id(preset_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Preset not found"))?;

        self.avatar_repo.upsert(user_id).await?;
        let updated = self.avatar_repo.set_preset(user_id, preset_id).await?;
        Ok(ReadUserAvatarDto::from(updated))
    }

    #[instrument(err, skip(self))]
    pub async fn trigger_generation(&self, user_id: &str) -> Result<ReadGenerationRunDto> {
        let avatar = self
            .avatar_repo
            .get_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Avatar not enabled for user"))?;

        if !avatar.is_enabled {
            anyhow::bail!("Avatar is disabled");
        }

        if let Some(next_at) = avatar.next_generation_at {
            if next_at > Utc::now() {
                let secs = (next_at - Utc::now()).num_seconds().max(0);
                anyhow::bail!("Generation on cooldown — available in {}s", secs);
            }
        }

        let tier = format!("{:?}", avatar.tier).to_lowercase();
        let window_start = Utc::now() - data_window(&tier);
        let input_data = self.aggregate_input_data(user_id, window_start).await?;

        let (run_id, _, _) = self
            .run_generation_pipeline(user_id, &input_data, &tier)
            .await?;

        let run = self
            .run_repo
            .get_latest_for_user(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Run not found after generation"))?;

        let _ = run_id;
        Ok(ReadGenerationRunDto::from(run))
    }

    #[instrument(err, skip(self))]
    pub async fn list_runs(&self, user_id: &str) -> Result<Vec<ReadGenerationRunDto>> {
        let runs = self.run_repo.list_for_user(user_id).await?;
        Ok(runs.into_iter().map(ReadGenerationRunDto::from).collect())
    }

    #[instrument(err, skip(self))]
    pub async fn get_latest_run(&self, user_id: &str) -> Result<Option<ReadGenerationRunDto>> {
        let run = self.run_repo.get_latest_for_user(user_id).await?;
        Ok(run.map(ReadGenerationRunDto::from))
    }

    #[instrument(err, skip(self))]
    pub async fn list_avatar_history(
        &self,
        user_id: &str,
    ) -> Result<Vec<ReadUserAvatarHistoryDto>> {
        let history = sqlx::query_as!(
            crate::entity::avatar::UserAvatarHistory,
            r#"
            SELECT id, user_id, image_url, thumb_url, generation_run_id,
                   generated_at as "generated_at: chrono::DateTime<chrono::Utc>"
            FROM user_avatar_history
            WHERE user_id = $1
            ORDER BY generated_at DESC
            "#,
            user_id
        )
        .fetch_all(self.db.get_pool())
        .await?;

        Ok(history
            .into_iter()
            .map(ReadUserAvatarHistoryDto::from)
            .collect())
    }

    // -----------------------------------------------------------------------
    // Hint operations
    // -----------------------------------------------------------------------

    #[instrument(err, skip(self))]
    pub async fn search_hints(&self, query: &str) -> Result<Vec<crate::dto::avatar::read_avatar::ReadHintDto>> {
        let hints = self.hint_repo.search(query, 20).await?;
        Ok(hints
            .into_iter()
            .map(crate::dto::avatar::read_avatar::ReadHintDto::from)
            .collect())
    }

    #[instrument(err, skip(self))]
    pub async fn create_hint(&self, label: &str) -> Result<crate::dto::avatar::read_avatar::ReadHintDto> {
        let hint = self.hint_repo.create(label).await?;
        Ok(crate::dto::avatar::read_avatar::ReadHintDto::from(hint))
    }

    #[instrument(err, skip(self))]
    pub async fn assign_category_hint(
        &self,
        category_id: Uuid,
        user_id: &str,
        hint_id: Uuid,
    ) -> Result<()> {
        self.hint_repo.increment_usage(hint_id).await?;
        self.category_hint_repo
            .assign(category_id, user_id, hint_id)
            .await?;
        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn remove_category_hint(
        &self,
        category_id: Uuid,
        user_id: &str,
        hint_id: Uuid,
    ) -> Result<()> {
        self.category_hint_repo
            .remove(category_id, user_id, hint_id)
            .await?;
        self.hint_repo.decrement_usage(hint_id).await?;
        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn list_category_hints(
        &self,
        category_id: Uuid,
        user_id: &str,
    ) -> Result<Vec<crate::dto::avatar::read_avatar::ReadHintDto>> {
        let hints = self
            .category_hint_repo
            .list_for_category(category_id, user_id)
            .await?;
        Ok(hints
            .into_iter()
            .map(crate::dto::avatar::read_avatar::ReadHintDto::from)
            .collect())
    }

    // -----------------------------------------------------------------------
    // Preset operations
    // -----------------------------------------------------------------------

    #[instrument(err, skip(self))]
    pub async fn list_active_presets(&self) -> Result<Vec<ReadAvatarPresetDto>> {
        let presets = self.preset_repo.list_active().await?;
        Ok(presets
            .into_iter()
            .map(ReadAvatarPresetDto::from)
            .collect())
    }

    // -----------------------------------------------------------------------
    // Admin operations
    // -----------------------------------------------------------------------

    #[instrument(err, skip(self))]
    pub async fn admin_trigger_generation(
        &self,
        user_id: &str,
    ) -> Result<ReadGenerationRunDto> {
        self.trigger_generation(user_id).await
    }

    #[instrument(err, skip(self))]
    pub async fn admin_generate(
        &self,
        source: AdminGenerationSource,
        assign_to_user_id: Option<&str>,
    ) -> Result<ReadGenerationRunDto> {
        let (input_data, target_user_id) = match &source {
            AdminGenerationSource::User { user_id } => {
                let avatar = self
                    .avatar_repo
                    .get_by_user_id(user_id)
                    .await?
                    .ok_or_else(|| anyhow::anyhow!("No avatar found for user {}", user_id))?;
                let tier = format!("{:?}", avatar.tier).to_lowercase();
                let window_start = Utc::now() - data_window(&tier);
                let data = self.aggregate_input_data(user_id, window_start).await?;
                (data, assign_to_user_id.unwrap_or(user_id).to_string())
            }
            AdminGenerationSource::Manual { data } => {
                let user_id = assign_to_user_id
                    .ok_or_else(|| anyhow::anyhow!("assign_to_user_id required for manual source"))?;
                (data.clone(), user_id.to_string())
            }
        };

        let avatar = self.avatar_repo.get_by_user_id(&target_user_id).await?
            .ok_or_else(|| anyhow::anyhow!("No avatar row found for target user"))?;
        let tier = format!("{:?}", avatar.tier).to_lowercase();

        self.run_generation_pipeline(&target_user_id, &input_data, &tier)
            .await?;

        let run = self
            .run_repo
            .get_latest_for_user(&target_user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Run not found after generation"))?;

        Ok(ReadGenerationRunDto::from(run))
    }

    #[instrument(err, skip(self))]
    pub async fn admin_list_all_presets(&self) -> Result<Vec<ReadAvatarPresetDto>> {
        let presets = self.preset_repo.list_all().await?;
        Ok(presets
            .into_iter()
            .map(ReadAvatarPresetDto::from)
            .collect())
    }

    #[instrument(err, skip(self))]
    pub async fn admin_create_preset(
        &self,
        dto: CreateAvatarPresetDto,
    ) -> Result<ReadAvatarPresetDto> {
        let preset = self.preset_repo.create(dto).await?;
        Ok(ReadAvatarPresetDto::from(preset))
    }

    #[instrument(err, skip(self))]
    pub async fn admin_update_preset(
        &self,
        id: Uuid,
        dto: UpdateAvatarPresetDto,
    ) -> Result<ReadAvatarPresetDto> {
        let preset = self.preset_repo.update(id, dto).await?;
        Ok(ReadAvatarPresetDto::from(preset))
    }

    #[instrument(err, skip(self))]
    pub async fn admin_delete_preset(&self, id: Uuid) -> Result<()> {
        self.preset_repo.delete(id).await
    }
}
