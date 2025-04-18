use serde::{Deserialize, Serialize};
use uuid::Uuid;

use super::category::Category;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct Tag {
    pub id: Uuid,
    pub label: String,
    pub color: String,
}

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct TagDetails {
    pub id: Uuid,
    pub label: String,
    pub allowed_categories: Vec<Category>,
    pub usages: i64,
    pub created_by: String,
    pub color: String,
}
