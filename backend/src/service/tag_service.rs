use anyhow::{anyhow, Ok, Result};
use uuid::Uuid;

use crate::{
    dto::tag::{create_tag::UpsertTagDto, filter_tags::TagFilterDto, read_tag::ReadTagDto},
    entity::{category::Category, tag::Tag},
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

    pub async fn upsert_tag(&self, dto: UpsertTagDto) -> Result<ReadTagDto> {
        let res = self.repo.upsert(dto).await?;
        Ok(ReadTagDto::from(res))
    }

    pub async fn add_allowed_category(&self, tag: &Tag, category: &Category) -> Result<()> {
        self.repo.add_allowed_category(tag.id, category.id).await?;
        Ok(())
    }

    pub async fn remove_allowed_category(&self, tag: &Tag, category: &Category) -> Result<()> {
        self.repo
            .remove_allowed_category(tag.id, category.id)
            .await?;
        Ok(())
    }

    pub async fn filter_tags(&self, filter: TagFilterDto) -> Result<Vec<ReadTagDto>> {
        let res = self.repo.filter_tags(filter).await?;
        Ok(res.into_iter().map(ReadTagDto::from).collect())
    }

    pub async fn get_by_id(&self, id: Uuid) -> Result<Tag> {
        let res = self
            .repo
            .filter_tags(TagFilterDto {
                id: Some(id),
                label: None,
            })
            .await?;

        if res.is_empty() {
            return Err(anyhow!("Tag not found"));
        }

        Ok(res[0].clone())
    }

    pub async fn delete_tag(&self, id: Uuid) -> Result<()> {
        self.repo.delete_tag(id).await?;
        Ok(())
    }
}
