use anyhow::{anyhow, Ok, Result};
use uuid::Uuid;

use crate::{
    dto::category::{
        create_category::CreateCategoryDto, filter_category::FilterCategoryDto,
        read_category::ReadCategoryDto,
    },
    entity::category::Category,
    repository::category::{CategoryRepository, CategoryRepositoryTrait},
};

#[derive(Clone)]
pub struct CategoryService {
    repo: CategoryRepository,
}

impl CategoryService {
    pub fn new(repo: CategoryRepository) -> Self {
        Self { repo }
    }

    pub async fn upsert_category(&self, dto: CreateCategoryDto) -> Result<ReadCategoryDto> {
        let res = self.repo.upsert(dto).await?;
        Ok(ReadCategoryDto::from(res))
    }

    pub async fn delete_category(&self, id: Uuid) -> Result<()> {
        self.repo.delete_category(id).await?;
        Ok(())
    }

    pub async fn filter_categories(
        &self,
        filter: FilterCategoryDto,
    ) -> Result<Vec<ReadCategoryDto>> {
        let res = self.repo.filter_categories(filter).await?;
        Ok(res.into_iter().map(ReadCategoryDto::from).collect())
    }

    pub async fn get_by_id(&self, category_id: Uuid) -> Result<Category> {
        let res = self
            .repo
            .filter_categories(FilterCategoryDto {
                id: Some(category_id),
                name: None,
            })
            .await?;

        if res.is_empty() {
            return Err(anyhow!("Category not found"));
        }

        Ok(res[0].clone())
    }
}
