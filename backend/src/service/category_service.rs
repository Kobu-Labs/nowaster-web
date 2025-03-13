use anyhow::{Ok, Result};
use uuid::Uuid;

use crate::{
    dto::category::{
        create_category::CreateCategoryDto, filter_category::FilterCategoryDto,
        read_category::ReadCategoryDto, update_category::UpdateCategoryDto,
    },
    entity::category::Category,
    repository::category::{CategoryRepository, CategoryRepositoryTrait},
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct CategoryService {
    repo: CategoryRepository,
}

impl CategoryService {
    pub fn new(repo: CategoryRepository) -> Self {
        Self { repo }
    }

    pub async fn upsert_category(
        &self,
        dto: CreateCategoryDto,
        actor: ClerkUser,
    ) -> Result<ReadCategoryDto> {
        let res = self.repo.upsert(dto, actor).await?;
        Ok(ReadCategoryDto::from(res))
    }

    pub async fn delete_category(&self, id: Uuid) -> Result<()> {
        self.repo.delete_category(id).await?;
        Ok(())
    }

    pub async fn filter_categories(
        &self,
        filter: FilterCategoryDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadCategoryDto>> {
        let res = self.repo.filter_categories(filter, actor).await?;
        Ok(res.into_iter().map(ReadCategoryDto::from).collect())
    }

    pub async fn get_by_id(&self, category_id: Uuid, actor: ClerkUser) -> Result<Category> {
        self.repo.find_by_id(category_id, actor).await
    }

    pub async fn update_category(
        &self,
        dto: UpdateCategoryDto,
        actor: ClerkUser,
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
}
