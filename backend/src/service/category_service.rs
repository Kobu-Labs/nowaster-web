use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::category::{
        create_category::CreateCategoryDto,
        filter_category::FilterCategoryDto,
        read_category::{CategoryStatsDto, ReadCategoryDto, ReadCategoryWithSessionCountDto},
        update_category::UpdateCategoryDto,
    },
    entity::category::Category,
    repository::category::{CategoryRepository, CategoryRepositoryTrait},
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct CategoryService {
    repo: CategoryRepository,
}

impl CategoryService {
    pub fn new(repo: CategoryRepository) -> Self {
        Self { repo }
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn upsert_category(
        &self,
        dto: CreateCategoryDto,
        actor: Actor,
    ) -> Result<ReadCategoryDto> {
        let res = self.repo.upsert(dto, actor).await?;
        Ok(ReadCategoryDto::from(res))
    }

    #[instrument(err, skip(self), fields(category_id = %id))]
    pub async fn delete_category(&self, id: Uuid) -> Result<()> {
        self.repo.delete_category(id).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn filter_categories(
        &self,
        filter: FilterCategoryDto,
        actor: Actor,
    ) -> Result<Vec<ReadCategoryDto>> {
        let res = self.repo.filter_categories(filter, actor).await?;
        Ok(res.into_iter().map(ReadCategoryDto::from).collect())
    }

    #[instrument(err, skip(self), fields(category_id = %category_id, actor = %actor))]
    pub async fn get_by_id(&self, category_id: Uuid, actor: Actor) -> Result<Category> {
        self.repo.find_by_id(category_id, actor).await
    }

    #[instrument(err, skip(self), fields(category_id = %dto.id, actor = %actor))]
    pub async fn update_category(
        &self,
        dto: UpdateCategoryDto,
        actor: Actor,
    ) -> Result<ReadCategoryDto> {
        let category = self.repo.find_by_id(dto.id, actor.clone()).await?;
        if category.created_by != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to update this category"
            ));
        }
        let res = self.repo.update(dto).await?;
        Ok(ReadCategoryDto::from(res))
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn get_categories_with_session_count(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadCategoryWithSessionCountDto>> {
        self.repo.get_categories_with_session_count(actor).await
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn get_category_statistics(&self, actor: Actor) -> Result<CategoryStatsDto> {
        self.repo.get_category_statistics(actor).await
    }
}
