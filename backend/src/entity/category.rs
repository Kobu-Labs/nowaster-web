use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct Category {
    pub id: Uuid,
    pub name: String,
    pub created_by: String,
}
