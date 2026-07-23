use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community::{
        create_community::CreateCommunityDto, read_community::ReadCommunityDto,
        update_community::UpdateCommunityDto,
    },
    repository::community::CommunityRepository,
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct CommunityService {
    repo: CommunityRepository,
}

impl CommunityService {
    pub fn new(repo: CommunityRepository) -> Self {
        Self { repo }
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn create_community(
        &self,
        dto: CreateCommunityDto,
        actor: &Actor,
    ) -> Result<ReadCommunityDto> {
        let community = self.repo.create(dto, &actor.user_id).await?;
        Ok(ReadCommunityDto::from_entity(community, actor))
    }

    #[instrument(err, skip(self), fields(community_id = %id, actor = %actor))]
    pub async fn get_community(&self, id: Uuid, actor: &Actor) -> Result<ReadCommunityDto> {
        let community = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.is_archived() && community.owner_id != actor.user_id {
            return Err(anyhow::anyhow!("Community not found"));
        }

        Ok(ReadCommunityDto::from_entity(community, actor))
    }

    #[instrument(err, skip(self), fields(community_id = %dto.id, actor = %actor))]
    pub async fn update_community(
        &self,
        dto: UpdateCommunityDto,
        actor: &Actor,
    ) -> Result<ReadCommunityDto> {
        let community = self
            .repo
            .find_by_id(dto.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.owner_id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to update this community"
            ));
        }

        let updated = self.repo.update(dto).await?;
        Ok(ReadCommunityDto::from_entity(updated, actor))
    }

    #[instrument(err, skip(self), fields(community_id = %id, actor = %actor))]
    pub async fn archive_community(&self, id: Uuid, actor: &Actor) -> Result<()> {
        let community = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.owner_id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to archive this community"
            ));
        }

        if community.is_archived() {
            return Err(anyhow::anyhow!("This community is already archived"));
        }

        self.repo.archive(id).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn list_my_communities(&self, actor: &Actor) -> Result<Vec<ReadCommunityDto>> {
        let communities = self.repo.list_owned_by(&actor.user_id).await?;
        Ok(communities
            .into_iter()
            .map(|c| ReadCommunityDto::from_entity(c, actor))
            .collect())
    }
}
