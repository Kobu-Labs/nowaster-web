use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::{
        category::read_category::ReadCategoryDto,
        community_category::{
            create_mapping::CreateCategoryMappingDto,
            create_tracked_category::CreateTrackedCategoryDto,
            read_mapping::ReadCategoryMappingDto, read_tracked_category::ReadTrackedCategoryDto,
            update_tracked_category::UpdateTrackedCategoryDto,
        },
    },
    entity::{community::CommunityDataVisibility, community_category::CommunityTrackedCategory},
    repository::{
        community::CommunityRepository,
        community_category::{CommunityCategoryRepository, MappingWithDetailsRow},
    },
    router::clerk::Actor,
    service::category_service::CategoryService,
};

fn tracked_category_to_dto(
    entity: CommunityTrackedCategory,
    mapped_member_count: i64,
) -> ReadTrackedCategoryDto {
    ReadTrackedCategoryDto {
        id: entity.id,
        community_id: entity.community_id,
        name: entity.name,
        color: entity.color,
        mapped_member_count,
    }
}

fn mapping_row_to_dto(row: MappingWithDetailsRow) -> ReadCategoryMappingDto {
    ReadCategoryMappingDto {
        id: row.id,
        tracked_category: ReadTrackedCategoryDto {
            id: row.tracked_category_id,
            community_id: row.tracked_category_community_id,
            name: row.tracked_category_name,
            color: row.tracked_category_color,
            mapped_member_count: row.tracked_category_mapped_member_count,
        },
        personal_category: ReadCategoryDto {
            id: row.personal_category_id,
            name: row.personal_category_name,
            color: row.personal_category_color,
            last_used_at: row.personal_category_last_used_at,
        },
        created_at: row.created_at,
    }
}

#[derive(Clone)]
pub struct CommunityCategoryService {
    repo: CommunityCategoryRepository,
    community_repo: CommunityRepository,
    category_service: CategoryService,
}

impl CommunityCategoryService {
    pub fn new(
        repo: CommunityCategoryRepository,
        community_repo: CommunityRepository,
        category_service: CategoryService,
    ) -> Self {
        Self {
            repo,
            community_repo,
            category_service,
        }
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn create_tracked_category(
        &self,
        community_id: Uuid,
        dto: CreateTrackedCategoryDto,
        actor: &Actor,
    ) -> Result<ReadTrackedCategoryDto> {
        self.assert_owner(community_id, actor).await?;

        if self
            .repo
            .find_tracked_category_by_name(community_id, &dto.name)
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!(
                "This community already tracks a category named \"{}\"",
                dto.name
            ));
        }

        let created = self
            .repo
            .create_tracked_category(community_id, &dto.name, &dto.color)
            .await?;

        Ok(tracked_category_to_dto(created, 0))
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %dto.id, actor = %actor))]
    pub async fn update_tracked_category(
        &self,
        dto: UpdateTrackedCategoryDto,
        actor: &Actor,
    ) -> Result<ReadTrackedCategoryDto> {
        let existing = self
            .repo
            .find_tracked_category(dto.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Tracked category not found"))?;

        self.assert_owner(existing.community_id, actor).await?;

        if let Some(new_name) = &dto.name {
            if new_name != &existing.name
                && self
                    .repo
                    .find_tracked_category_by_name(existing.community_id, new_name)
                    .await?
                    .is_some()
            {
                return Err(anyhow::anyhow!(
                    "This community already tracks a category named \"{}\"",
                    new_name
                ));
            }
        }

        let updated = self
            .repo
            .update_tracked_category(dto.id, dto.name.as_deref(), dto.color.as_deref())
            .await?;

        let mapped_member_count = self.repo.count_mapped_members(updated.id).await?;
        Ok(tracked_category_to_dto(updated, mapped_member_count))
    }

    #[instrument(err, skip(self), fields(tracked_category_id = %id, actor = %actor))]
    pub async fn delete_tracked_category(&self, id: Uuid, actor: &Actor) -> Result<()> {
        let existing = self
            .repo
            .find_tracked_category(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Tracked category not found"))?;

        self.assert_owner(existing.community_id, actor).await?;

        self.repo.delete_tracked_category(id).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn list_tracked_categories(
        &self,
        community_id: Uuid,
        actor: &Actor,
    ) -> Result<Vec<ReadTrackedCategoryDto>> {
        self.assert_can_view(community_id, actor).await?;

        let tracked_categories = self.repo.list_tracked_categories(community_id).await?;

        let mut result = Vec::with_capacity(tracked_categories.len());
        for tracked_category in tracked_categories {
            let mapped_member_count = self.repo.count_mapped_members(tracked_category.id).await?;
            result.push(tracked_category_to_dto(
                tracked_category,
                mapped_member_count,
            ));
        }

        Ok(result)
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn create_mapping(
        &self,
        community_id: Uuid,
        dto: CreateCategoryMappingDto,
        actor: &Actor,
    ) -> Result<ReadCategoryMappingDto> {
        if self
            .community_repo
            .find_membership(community_id, &actor.user_id)
            .await?
            .is_none()
        {
            return Err(anyhow::anyhow!(
                "You must be a member to map categories in this community"
            ));
        }

        let personal_category = self
            .category_service
            .get_by_id(dto.personal_category_id, actor)
            .await
            .map_err(|_| anyhow::anyhow!("You can only map your own categories"))?;

        let tracked_category = self
            .repo
            .find_tracked_category(dto.tracked_category_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Tracked category not found"))?;

        if tracked_category.community_id != community_id {
            return Err(anyhow::anyhow!(
                "This tracked category does not belong to this community"
            ));
        }

        if self
            .repo
            .find_mapping_by_categories(
                dto.tracked_category_id,
                &actor.user_id,
                dto.personal_category_id,
            )
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!("You've already mapped this category"));
        }

        let mapping = self
            .repo
            .create_mapping(
                community_id,
                dto.tracked_category_id,
                &actor.user_id,
                dto.personal_category_id,
            )
            .await?;

        let mapped_member_count = self.repo.count_mapped_members(tracked_category.id).await?;

        Ok(ReadCategoryMappingDto {
            id: mapping.id,
            tracked_category: tracked_category_to_dto(tracked_category, mapped_member_count),
            personal_category: ReadCategoryDto::from(personal_category),
            created_at: mapping.created_at,
        })
    }

    #[instrument(err, skip(self), fields(mapping_id = %id, actor = %actor))]
    pub async fn delete_mapping(&self, id: Uuid, actor: &Actor) -> Result<()> {
        let mapping = self
            .repo
            .find_mapping(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Mapping not found"))?;

        if mapping.user_id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You can only remove your own category mappings"
            ));
        }

        self.repo.delete_mapping(id, &actor.user_id).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn list_my_mappings(
        &self,
        community_id: Uuid,
        actor: &Actor,
    ) -> Result<Vec<ReadCategoryMappingDto>> {
        let rows = self
            .repo
            .list_mappings_for_member(community_id, &actor.user_id)
            .await?;

        Ok(rows.into_iter().map(mapping_row_to_dto).collect())
    }

    async fn assert_owner(&self, community_id: Uuid, actor: &Actor) -> Result<()> {
        let community = self
            .community_repo
            .find_by_id(community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.owner_id != actor.user_id {
            return Err(anyhow::anyhow!(
                "Only the owner can manage tracked categories"
            ));
        }

        Ok(())
    }

    async fn assert_can_view(&self, community_id: Uuid, actor: &Actor) -> Result<()> {
        let community = self
            .community_repo
            .find_by_id(community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.data_visibility == CommunityDataVisibility::Public {
            return Ok(());
        }

        let is_member = self
            .community_repo
            .find_membership(community_id, &actor.user_id)
            .await?
            .is_some();

        if !is_member {
            return Err(anyhow::anyhow!(
                "You must be a member to view this community's tracked categories"
            ));
        }

        Ok(())
    }
}
