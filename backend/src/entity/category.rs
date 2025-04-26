use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::category::read_category::ReadCategoryDto;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub created_by: String,
    pub color: String,
}

impl From<Category> for ReadCategoryDto {
    fn from(category: Category) -> Self {
        Self {
            id: category.id,
            name: category.name,
            color: category.color,
        }
    }
}
