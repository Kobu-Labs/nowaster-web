use anyhow::{Ok, Result};
use uuid::Uuid;

use crate::{
    dto::tag::{
        create_tag::{CreateTagDto, UpdateTagDto},
        filter_tags::TagFilterDto,
        read_tag::ReadTagDetailsDto,
    },
    entity::{category::Category, tag::TagDetails},
    repository::{
        category::CategoryRepository,
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
}
