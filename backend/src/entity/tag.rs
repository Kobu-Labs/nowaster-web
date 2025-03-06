use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct Tag {
    pub id: Uuid,
    pub label: String,
}
