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
    service::avatar::generator::{upload_avatar_images, ACTIVITY_ENTRY_SEP, ACTIVITY_FIELD_SEP},
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
    http_client: reqwest::Client,
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
            http_client: reqwest::Client::new(),
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
                    EXTRACT(EPOCH FROM SUM(s.end_time - s.start_time))::float8 / 3600.0 AS total_hours
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
                h.label AS "hint_label?"
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
            println!("{} {}", category_name, total_hours );
            let hours = (total_hours * 10.0).round() / 10.0;
            if hints.is_empty() {
                parts.push(format!("{}{}{}", category_name, ACTIVITY_FIELD_SEP, hours));
            } else {
                for hint in hints {
                    parts.push(format!("{}{}{}", hint, ACTIVITY_FIELD_SEP, hours));
                }
            }
        }
        parts.sort();

        let res = parts.join(ACTIVITY_ENTRY_SEP);
        println!("{}",res);
        Ok(res)
    }

    // -----------------------------------------------------------------------
    // Core generation pipeline
    // -----------------------------------------------------------------------

    /// Creates a run row and marks it running. Fast, DB-only — safe to await
    /// synchronously from a request handler before handing the slow part
    /// (`execute_generation`) off to a background task.
    async fn create_pending_run(&self, user_id: &str) -> Result<Uuid> {
        let run = self.run_repo.create(user_id).await?;
        self.run_repo.set_running(run.id).await?;
        Ok(run.id)
    }

    /// Runs the actual (slow, third-party-API-bound) generation work for an
    /// already-created run and records its outcome.
    async fn execute_generation(
        &self,
        run_id: Uuid,
        user_id: &str,
        input_data: &str,
        tier: &str,
        assign: bool,
    ) -> Result<(Uuid, String, String)> {
        let user_avatar = self.avatar_repo.get_by_user_id(user_id).await?;
        let preset = if let Some(preset_id) = user_avatar.and_then(|a| a.base_preset_id) {
            self.preset_repo.find_by_id(preset_id).await?
        } else {
            None
        };

        let preset = match preset {
            Some(p) => p,
            None => {
                self.run_repo.set_failed(run_id, "No preset selected").await?;
                anyhow::bail!("Cannot generate avatar: no preset selected for user {}", user_id);
            }
        };

        // Use cached Leonardo init image ID, or upload the preset image and cache the result.
        let preset_init_id = if let Some(cached_id) = preset.leonardo_init_image_id.clone() {
            cached_id
        } else {
            let image_bytes = self
                .http_client
                .get(&preset.reference_image_url)
                .send()
                .await
                .and_then(|r| r.error_for_status())
                .context("Failed to download preset image")?
                .bytes()
                .await?
                .to_vec();

            let id = crate::service::avatar::generator::upload_init_image(
                &self.http_client,
                &self.config.leonardo.api_key,
                image_bytes,
                "jpg",
            )
            .await
            .context("Failed to upload preset image to Leonardo")?;

            if let Err(e) = self.preset_repo.set_leonardo_init_image_id(preset.id, &id).await {
                tracing::warn!(preset_id = %preset.id, "Failed to cache Leonardo init image ID: {}", e);
            }

            id
        };

        let generation_result = crate::service::avatar::generator::generate_avatar_with_init_id(
            &self.http_client,
            &self.config.leonardo.api_key,
            &self.config.leonardo.model_id,
            &self.config.leonardo.layout_reference_id,
            &preset_init_id,
            input_data,
        )
        .await;

        let image_bytes = match generation_result {
            Ok(bytes) => bytes,
            Err(e) => {
                tracing::error!(run_id = %run_id, "Generation failed: {:#}", e);
                let _ = self.run_repo.set_failed(run_id, &e.to_string()).await;
                return Err(e.context("Image generation failed"));
            }
        };

        let upload_result = upload_avatar_images(
            &self.s3_client,
            &self.config.s3.bucket_name,
            &self.config.s3.endpoint_url,
            user_id,
            image_bytes,
        )
        .await;

        let (image_url, thumb_url) = match upload_result {
            Ok(urls) => urls,
            Err(e) => {
                let _ = self.run_repo.set_failed(run_id, &e.to_string()).await;
                return Err(e.context("S3 upload failed"));
            }
        };

        self.run_repo
            .set_success(run_id, &image_url, &thumb_url, input_data)
            .await?;

        if assign {
            let next_generation_at = Utc::now() + regen_interval(tier);
            self.avatar_repo
                .mark_generated(user_id, &image_url, &thumb_url, next_generation_at)
                .await?;
            self.history_repo
                .insert(user_id, &image_url, &thumb_url, run_id)
                .await?;
        }

        Ok((run_id, image_url, thumb_url))
    }

    /// Convenience wrapper for callers that want to await the full pipeline
    /// synchronously (admin tooling, where an immediate result is expected).
    async fn run_generation_pipeline(
        &self,
        user_id: &str,
        input_data: &str,
        tier: &str,
        assign: bool,
    ) -> Result<(Uuid, String, String)> {
        let run_id = self.create_pending_run(user_id).await?;
        self.execute_generation(run_id, user_id, input_data, tier, assign).await
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

        match self.create_pending_run(user_id).await {
            Ok(run_id) => {
                let service = self.clone();
                let user_id = user_id.to_string();
                tokio::spawn(async move {
                    if let Err(e) = service
                        .execute_generation(run_id, &user_id, &input_data, &tier, true)
                        .await
                    {
                        tracing::error!(user_id, "Immediate generation on enable failed: {:#}", e);
                    }
                });
            }
            Err(e) => tracing::error!(user_id, "Failed to start generation on enable: {}", e),
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

        let run_id = self.create_pending_run(user_id).await?;

        let service = self.clone();
        let spawned_user_id = user_id.to_string();
        tokio::spawn(async move {
            if let Err(e) = service
                .execute_generation(run_id, &spawned_user_id, &input_data, &tier, true)
                .await
            {
                tracing::error!(user_id = %spawned_user_id, "Background generation failed: {:#}", e);
            }
        });

        let run = self
            .run_repo
            .get_latest_for_user(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Run not found after generation"))?;

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
        let avatar = self
            .avatar_repo
            .get_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Avatar not enabled for user"))?;

        let tier = format!("{:?}", avatar.tier).to_lowercase();
        let window_start = Utc::now() - data_window(&tier);
        let input_data = self.aggregate_input_data(user_id, window_start).await?;

        self.run_generation_pipeline(user_id, &input_data, &tier, true)
            .await?;

        let run = self
            .run_repo
            .get_latest_for_user(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Run not found after generation"))?;

        Ok(ReadGenerationRunDto::from(run))
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

        self.run_generation_pipeline(&target_user_id, &input_data, &tier, true)
            .await?;

        let run = self
            .run_repo
            .get_latest_for_user(&target_user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Run not found after generation"))?;

        Ok(ReadGenerationRunDto::from(run))
    }

    #[instrument(err, skip(self))]
    pub async fn admin_get_playground_data(
        &self,
        user_id: &str,
        weeks: i64,
    ) -> Result<Vec<crate::dto::avatar::read_avatar::ActivityEntryDto>> {
        let window_start = Utc::now() - Duration::weeks(weeks.max(1));
        let raw = self.aggregate_input_data(user_id, window_start).await?;
        let entries = raw
            .split(ACTIVITY_ENTRY_SEP)
            .filter(|s| !s.is_empty())
            .filter_map(|part| {
                let mut iter = part.rsplitn(2, ACTIVITY_FIELD_SEP);
                let hours: f64 = iter.next()?.trim().parse().ok()?;
                let label = iter.next()?.trim().to_string();
                Some(crate::dto::avatar::read_avatar::ActivityEntryDto { label, hours })
            })
            .collect();
        Ok(entries)
    }

    #[instrument(err, skip(self))]
    pub async fn admin_playground_generate(
        &self,
        user_id: &str,
    ) -> Result<ReadGenerationRunDto> {
        let avatar = self
            .avatar_repo
            .get_by_user_id(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("No avatar found for user {}", user_id))?;
        let tier = format!("{:?}", avatar.tier).to_lowercase();
        // Use a wider window for playground so admin can test users with sparse recent activity.
        let window_start = Utc::now() - Duration::weeks(13);
        let input_data = self.aggregate_input_data(user_id, window_start).await?;
        tracing::info!(user_id, input_data = %input_data, "playground input_data");

        // Swallow pipeline errors — the run record has the error_message set via set_failed.
        // Pre-pipeline errors (avatar/data lookup) propagate normally above.
        if let Err(e) = self
            .run_generation_pipeline(user_id, &input_data, &tier, false)
            .await
        {
            tracing::warn!(user_id, "Playground pipeline failed (returning run record): {:#}", e);
        }

        self.run_repo
            .get_latest_for_user(user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("No run found for user {}", user_id))
            .map(ReadGenerationRunDto::from)
    }

    #[instrument(err, skip(self))]
    pub async fn admin_list_recent_runs(
        &self,
        limit: i64,
    ) -> Result<Vec<ReadGenerationRunDto>> {
        let runs = self.run_repo.list_all_recent(limit).await?;
        Ok(runs.into_iter().map(ReadGenerationRunDto::from).collect())
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

    /// Accepts a list of `(preset_name, image_bytes, extension)` tuples, uploads each to S3
    /// and Leonardo, and creates a preset record for each one.
    #[instrument(err(Debug), skip(self, images), fields(count = images.len()))]
    pub async fn admin_bulk_upload_presets(
        &self,
        images: Vec<(String, Vec<u8>, String)>,
    ) -> Result<Vec<ReadAvatarPresetDto>> {
        let mut results = Vec::with_capacity(images.len());

        for (name, bytes, extension) in images {
            let (reference_image_url, thumbnail_url) =
                crate::service::avatar::generator::upload_preset_image_to_s3(
                    &self.s3_client,
                    &self.config.s3.bucket_name,
                    &self.config.s3.endpoint_url,
                    bytes.clone(),
                    &extension,
                )
                .await
                .context("Failed to upload preset image to S3")?;

            let leonardo_id = crate::service::avatar::generator::upload_init_image(
                &self.http_client,
                &self.config.leonardo.api_key,
                bytes,
                &extension,
            )
            .await
            .context("Failed to upload preset image to Leonardo")?;

            let preset = self
                .preset_repo
                .create(CreateAvatarPresetDto {
                    name,
                    thumbnail_url,
                    reference_image_url,
                    is_active: Some(true),
                })
                .await?;

            let preset = self
                .preset_repo
                .set_leonardo_init_image_id(preset.id, &leonardo_id)
                .await?;

            results.push(ReadAvatarPresetDto::from(preset));
        }

        Ok(results)
    }

    #[instrument(err, skip(self), fields(preset_id = %id))]
    pub async fn admin_upload_preset_to_leonardo(&self, id: Uuid) -> Result<ReadAvatarPresetDto> {
        let preset = self
            .preset_repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Preset not found"))?;

        let image_bytes = self
            .http_client
            .get(&preset.reference_image_url)
            .send()
            .await
            .and_then(|r| r.error_for_status())
            .context("Failed to download preset reference image")?
            .bytes()
            .await?
            .to_vec();

        let extension = preset
            .reference_image_url
            .rsplit('.')
            .next()
            .unwrap_or("jpg")
            .to_lowercase();
        let extension = if ["jpg", "jpeg", "png", "webp"].contains(&extension.as_str()) {
            extension
        } else {
            "jpg".to_string()
        };

        let leonardo_id = crate::service::avatar::generator::upload_init_image(
            &self.http_client,
            &self.config.leonardo.api_key,
            image_bytes,
            &extension,
        )
        .await
        .context("Failed to upload preset image to Leonardo")?;

        let updated = self
            .preset_repo
            .set_leonardo_init_image_id(id, &leonardo_id)
            .await?;

        Ok(ReadAvatarPresetDto::from(updated))
    }
}
