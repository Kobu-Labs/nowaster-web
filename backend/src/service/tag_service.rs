use anyhow::{Ok, Result};
use uuid::Uuid;

use crate::{
    dto::{
        category::migrate_category::MigrationPreviewResponse,
        tag::{
            create_tag::{CreateTagDto, UpdateTagDto},
            filter_tags::TagFilterDto,
            migrate_tag::TagMigrationFilters,
            read_tag::{ReadTagDetailsDto, TagStatsDto},
        },
    },
    entity::{category::Category, tag::TagDetails},
    repository::{
        category::{CategoryRepository, CategoryRepositoryTrait},
        tag::{TagRepository, TagRepositoryTrait},
    },
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct TagService {
    repo: TagRepository,
    category_repo: CategoryRepository,
}

impl TagService {
    pub fn new(repo: TagRepository, cat_repo: CategoryRepository) -> Self {
        Self {
            repo,
            category_repo: cat_repo,
        }
    }

    pub async fn create_tag(
        &self,
        dto: CreateTagDto,
        actor: ClerkUser,
    ) -> Result<ReadTagDetailsDto> {
        let res = self.repo.create(dto, actor).await?;
        Ok(ReadTagDetailsDto::from(res))
    }

    pub async fn add_allowed_category(
        &self,
        tag: &TagDetails,
        category: &Category,
        actor: ClerkUser,
    ) -> Result<()> {
        if tag.created_by != actor.user_id {
            return Err(anyhow::anyhow!("Operation not allowed"));
        }

        if category.created_by != actor.user_id {
            return Err(anyhow::anyhow!("Operation not allowed"));
        }
        self.repo.add_allowed_category(tag.id, category.id).await?;
        Ok(())
    }

    pub async fn remove_allowed_category(
        &self,
        tag: &TagDetails,
        category: &Category,
        actor: ClerkUser,
    ) -> Result<()> {
        if tag.created_by != actor.user_id {
            return Err(anyhow::anyhow!("Operation not allowed"));
        }

        if category.created_by != actor.user_id {
            return Err(anyhow::anyhow!("Operation not allowed"));
        }

        self.repo
            .remove_allowed_category(tag.id, category.id)
            .await?;
        Ok(())
    }

    pub async fn filter_tags(
        &self,
        filter: TagFilterDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadTagDetailsDto>> {
        let res = self.repo.filter_tags(filter, actor).await?;
        Ok(res.into_iter().map(ReadTagDetailsDto::from).collect())
    }

    pub async fn get_by_id(&self, id: Uuid, actor: ClerkUser) -> Result<TagDetails> {
        self.repo.find_by_id(id, actor).await
    }

    pub async fn delete_tag(&self, id: Uuid, actor: ClerkUser) -> Result<()> {
        self.repo.delete_tag(id, actor).await?;
        Ok(())
    }

    pub async fn update_tag(
        &self,
        id: Uuid,
        dto: UpdateTagDto,
        actor: ClerkUser,
    ) -> Result<ReadTagDetailsDto> {
        let res = self.repo.update_tag(id, dto, actor).await?;
        Ok(ReadTagDetailsDto::from(res))
    }

    pub async fn get_tag_statistics(&self, actor: ClerkUser) -> Result<TagStatsDto> {
        self.repo.get_tag_statistics(actor).await
    }

    pub async fn get_tag_migration_preview(
        &self,
        from_tag_id: Uuid,
        filters: &TagMigrationFilters,
        actor: ClerkUser,
    ) -> Result<MigrationPreviewResponse> {
        // Validate that the from_tag belongs to the user
        self.repo.find_by_id(from_tag_id, actor.clone()).await?;
        
        // Validate category filters if provided
        if let Some(category_ids) = &filters.category_ids {
            for category_id in category_ids {
                self.category_repo.find_by_id(*category_id, actor.clone()).await?;
            }
        }
        
        self.repo.get_tag_migration_preview(from_tag_id, filters, actor).await
    }

    pub async fn migrate_tag(
        &self,
        from_tag_id: Uuid,
        target_tag_id: Option<Uuid>,
        filters: &TagMigrationFilters,
        actor: ClerkUser,
    ) -> Result<u64> {
        // Validate that the from_tag belongs to the user
        self.repo.find_by_id(from_tag_id, actor.clone()).await?;
        
        // Validate target_tag if provided
        if let Some(target_id) = target_tag_id {
            self.repo.find_by_id(target_id, actor.clone()).await?;
            
            // Prevent migrating from a tag to itself
            if from_tag_id == target_id {
                return Err(anyhow::anyhow!("Cannot migrate tag to itself"));
            }
        }
        
        // Validate category filters if provided
        if let Some(category_ids) = &filters.category_ids {
            for category_id in category_ids {
                self.category_repo.find_by_id(*category_id, actor.clone()).await?;
            }
        }
        
        self.repo.migrate_tag(from_tag_id, target_tag_id, filters, actor).await
    }
}
