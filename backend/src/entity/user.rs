use serde::{Deserialize, Serialize};

#[derive(Clone, Deserialize, Serialize, Debug)]
pub struct User {
    pub id: String,
    pub username: String,
}
