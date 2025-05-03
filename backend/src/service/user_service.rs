use crate::{
    dto::user::{create_user::CreateUserDto, update_user::UpdateUserDto},
    entity::user::User,
    repository::user::{UserRepository, UserRepositoryTrait},
    router::user::root::UserError,
};

#[derive(Clone)]
pub struct UserService {
    repo: UserRepository,
}

impl UserService {
    pub fn new(repo: UserRepository) -> Self {
        Self { repo }
    }

    pub async fn create(&self, dto: CreateUserDto) -> Result<User, UserError> {
        let res = self.repo.create(dto).await;
        match res {
            Ok(u) => Ok(u),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }

    pub async fn update_user(&self, dto: UpdateUserDto) -> Result<User, UserError> {
        let res = self.repo.update(dto).await;
        match res {
            Ok(u) => Ok(u),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }

    pub async fn get_user_by_name(&self, username: String) -> Result<User, UserError> {
        let res = self.repo.get_user_by_username(username).await;
        match res {
            Ok(u) => Ok(u),
            Err(_e) => Err(UserError::UserNotFound),
        }
    }
}
