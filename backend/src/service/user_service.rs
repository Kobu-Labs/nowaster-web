use crate::{
    dto::user::{create_user::CreateUserDto, read_user::ReadUserDto, update_user::UpdateUserDto},
    repository::user::{UserRepository, UserRepositoryTrait},
    router::{clerk::ClerkUser, user::root::UserError},
};

#[derive(Clone)]
pub struct UserService {
    repo: UserRepository,
}

impl UserService {
    pub fn new(repo: UserRepository) -> Self {
        Self { repo }
    }
    pub async fn create(&self, dto: CreateUserDto) -> Result<ReadUserDto, UserError> {
        let res = self.repo.create(dto).await;
        match res {
            Ok(u) => Ok(ReadUserDto::from(u)),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }

    pub async fn upsert(&self, dto: CreateUserDto) -> Result<(), UserError> {
        let res = self.repo.upsert(dto).await;
        match res {
            Ok(_) => Ok(()),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }

    pub async fn update_user(
        &self,
        dto: UpdateUserDto,
        actor: ClerkUser,
    ) -> Result<ReadUserDto, UserError> {
        if dto.id != actor.user_id {
            return Err(UserError::Unauthorized);
        }

        let res = self.repo.update(dto).await;
        match res {
            Ok(u) => Ok(ReadUserDto::from(u)),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }
}
