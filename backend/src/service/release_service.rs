use anyhow::{anyhow, Result};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::Database,
    dto::release::{
        CreateReleaseDto, LatestUnseenReleaseDto, ReadPublicReleaseDto, ReadReleaseDto,
        ReleaseListQueryDto, UpdateReleaseDto,
    },
    repository::release::ReleaseRepository,
};

#[derive(Clone)]
pub struct ReleaseService {
    repository: ReleaseRepository,
}

impl ReleaseService {
    pub fn new(db: &Arc<Database>) -> Self {
        Self {
            repository: ReleaseRepository::new(db),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn create_release(&self, dto: CreateReleaseDto) -> Result<ReadReleaseDto> {
        let release_id = self.repository.create_release(dto).await?;
        let release = self
            .repository
            .get_release_by_id(release_id)
            .await?
            .ok_or_else(|| anyhow!("Failed to fetch created release"))?;

        Ok(ReadReleaseDto::from(release))
    }

    #[instrument(err, skip(self))]
    pub async fn get_release_by_id(&self, release_id: Uuid) -> Result<Option<ReadReleaseDto>> {
        let release = self.repository.get_release_by_id(release_id).await?;
        Ok(release.map(ReadReleaseDto::from))
    }

    #[instrument(err, skip(self))]
    pub async fn get_public_release_by_version(
        &self,
        version: String,
        user_id: Option<String>,
    ) -> Result<Option<ReadPublicReleaseDto>> {
        let release = self.repository.get_release_by_version(version).await?;

        // Only return if released
        match release {
            Some(r) if r.released => {
                // If user is authenticated, mark as seen
                if let Some(uid) = user_id {
                    // Mark this release as seen (ignore errors to not block the response)
                    let _ = self.mark_release_seen(r.id, uid).await;
                }

                Ok(Some(ReadPublicReleaseDto::from(r)))
            }
            _ => Ok(None),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn list_releases(&self, query: ReleaseListQueryDto) -> Result<Vec<ReadReleaseDto>> {
        let releases = self.repository.list_releases(query).await?;
        Ok(releases.into_iter().map(ReadReleaseDto::from).collect())
    }

    #[instrument(err, skip(self))]
    pub async fn list_public_releases(&self) -> Result<Vec<ReadPublicReleaseDto>> {
        let query = ReleaseListQueryDto {
            released_only: Some(true),
            limit: None,
            offset: None,
        };

        let releases = self.repository.list_releases(query).await?;
        Ok(releases
            .into_iter()
            .map(ReadPublicReleaseDto::from)
            .collect())
    }

    #[instrument(err, skip(self))]
    pub async fn get_latest_released(
        &self,
        user_id: Option<String>,
    ) -> Result<Option<ReadPublicReleaseDto>> {
        let latest = self.repository.get_latest_released().await?;

        match latest {
            Some(r) => {
                if let Some(uid) = user_id {
                    let _ = self.mark_release_seen(r.id, uid).await;
                }

                Ok(Some(ReadPublicReleaseDto::from(r)))
            }
            None => Ok(None),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn get_latest_unseen_for_user(
        &self,
        user_id: String,
    ) -> Result<Option<LatestUnseenReleaseDto>> {
        let latest = self.repository.get_latest_released().await?;

        match latest {
            Some(release) => {
                let seen = self
                    .repository
                    .has_user_seen_release(release.id, user_id.clone())
                    .await?;

                let dto = LatestUnseenReleaseDto {
                    release: ReadPublicReleaseDto::from(release.clone()),
                    unseen: !seen,
                };

                // Mark as seen after checking (so dialog shows once, then never again)
                if !seen {
                    let _ = self.mark_release_seen(release.id, user_id).await;
                }

                Ok(Some(dto))
            }
            None => Ok(None),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn update_release(
        &self,
        release_id: Uuid,
        dto: UpdateReleaseDto,
    ) -> Result<ReadReleaseDto> {
        let updated = self.repository.update_release(release_id, dto).await?;

        if !updated {
            return Err(anyhow!("Release not found"));
        }

        let release = self
            .repository
            .get_release_by_id(release_id)
            .await?
            .ok_or_else(|| anyhow!("Failed to fetch updated release"))?;

        Ok(ReadReleaseDto::from(release))
    }

    #[instrument(err, skip(self))]
    pub async fn publish_release(&self, release_id: Uuid, released_by: String) -> Result<()> {
        // Get release before publishing
        let release = self
            .repository
            .get_release_by_id(release_id)
            .await?
            .ok_or_else(|| anyhow!("Release not found"))?;

        if release.released {
            return Err(anyhow!("Release already published"));
        }

        let published = self
            .repository
            .publish_release(release_id, released_by)
            .await?;

        if !published {
            return Err(anyhow!("Failed to publish release"));
        }

        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn unpublish_release(&self, release_id: Uuid) -> Result<()> {
        let unpublished = self.repository.unpublish_release(release_id).await?;

        if !unpublished {
            return Err(anyhow!("Failed to unpublish release or release not found"));
        }

        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn delete_release(&self, release_id: Uuid) -> Result<()> {
        let deleted = self.repository.delete_release(release_id).await?;

        if !deleted {
            return Err(anyhow!("Release not found"));
        }

        Ok(())
    }

    #[instrument(err, skip(self))]
    pub async fn mark_release_seen(&self, release_id: Uuid, user_id: String) -> Result<()> {
        // Mark this release as seen
        self.repository
            .mark_release_seen(release_id, user_id.clone())
            .await?;

        // Mark all older releases as seen automatically
        self.repository
            .mark_older_releases_seen(release_id, user_id)
            .await?;

        Ok(())
    }
}
