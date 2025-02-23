use anyhow::{Ok, Result};
use uuid::Uuid;

use crate::{
    dto::tag::{
        create_tag::{CreateTagDto, UpdateTagDto},
        filter_tags::TagFilterDto,
        read_tag::ReadTagDetailsDto,
    },
    entity::{category::Category, tag::TagDetails},
    repository::tag::{TagRepository, TagRepositoryTrait},
};

#[derive(Clone)]
pub struct TagService {
    repo: TagRepository,
}

impl TagService {
    pub fn new(repo: TagRepository) -> Self {
        Self { repo }
    }

    pub async fn create_tag(&self, dto: CreateTagDto) -> Result<ReadTagDetailsDto> {
        let res = self.repo.create(dto).await?;
        Ok(ReadTagDetailsDto::from(res))
    }

    pub async fn add_allowed_category(&self, tag: &TagDetails, category: &Category) -> Result<()> {
        self.repo.add_allowed_category(tag.id, category.id).await?;
        Ok(())
    }

    pub async fn remove_allowed_category(
        &self,
        tag: &TagDetails,
        category: &Category,
    ) -> Result<()> {
        self.repo
            .remove_allowed_category(tag.id, category.id)
            .await?;
        Ok(())
    }

    pub async fn filter_tags(&self, filter: TagFilterDto) -> Result<Vec<ReadTagDetailsDto>> {
        let res = self.repo.filter_tags(filter).await?;
        Ok(res.into_iter().map(ReadTagDetailsDto::from).collect())
    }

    pub async fn get_by_id(&self, id: Uuid) -> Result<TagDetails> {
        self.repo.find_by_id(id).await
    }

    pub async fn delete_tag(&self, id: Uuid) -> Result<()> {
        self.repo.delete_tag(id).await?;
        Ok(())
    }

    pub async fn update_tag(&self, id: Uuid, dto: UpdateTagDto) -> Result<ReadTagDetailsDto> {
        let res = self.repo.update_tag(id, dto).await?;
        Ok(ReadTagDetailsDto::from(res))
    }
}
