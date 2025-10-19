use serde::{Deserialize, Serialize};
use validator::{Validate, ValidationError};

#[derive(Clone, Deserialize, Serialize, Debug, Validate)]
pub struct UpdateUserDto {
    #[serde(rename = "avatarUrl")]
    pub avatar_url: Option<String>,
    pub id: String,
    #[validate(
        custom(function = "validate"),
        length(min = 4, message = "Username must be at least 4 characters long")
    )]
    pub username: Option<String>,
}

fn validate(value: &str) -> Result<(), ValidationError> {
    if value.contains(' ') {
        return Err(ValidationError::new("username_contains_spaces")
            .with_message("Username cannot contain spaces".into()));
    }

    if !value.chars().all(|c| c.is_alphanumeric()) {
        return Err(ValidationError::new("username_not_alphanumeric")
            .with_message("Username can only contain letters and numbers".into()));
    }

    Ok(())
}
