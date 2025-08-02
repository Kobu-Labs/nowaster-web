use std::collections::HashMap;

use clerk_rs::clerk::Clerk;

use crate::{
    dto::user::{create_user::CreateUserDto, read_user::ReadUserDto, update_user::UpdateUserDto},
    entity::user::User,
    repository::user::{FilterUsersDto, IdFilter, UserRepository},
    router::user::root::UserError,
    service::friend_service::ReadUserAvatarDto,
};

#[derive(Clone)]
pub struct UserService {
    repo: UserRepository,
    clerk: Clerk,
}

impl UserService {
    pub fn new(repo: UserRepository, clerk: Clerk) -> Self {
        Self { repo, clerk }
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

    pub async fn update_user(&self, dto: UpdateUserDto) -> Result<ReadUserDto, UserError> {
        let res = self.repo.update(dto).await;
        match res {
            Ok(u) => Ok(ReadUserDto::from(u)),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }

    pub async fn get_user_by_name(
        &self,
        username: String,
    ) -> Result<Option<ReadUserAvatarDto>, UserError> {
        let user = self
            .repo
            .filter_users(FilterUsersDto {
                name: Some(username),
                ..Default::default()
            })
            .await
            .map_err(|e| UserError::UnknownError(e.to_string()))?;

        self.add_avatars(user).await.map(|va| va.first().cloned())
    }

    pub async fn get_user_by_id(
        &self,
        user_id: String,
    ) -> Result<Option<ReadUserAvatarDto>, UserError> {
        let user = self
            .repo
            .filter_users(FilterUsersDto {
                id: Some(IdFilter::Single(user_id)),
                ..Default::default()
            })
            .await
            .map_err(|e| UserError::UnknownError(e.to_string()))?;

        self.add_avatars(user).await.map(|va| va.first().cloned())
    }

    pub async fn get_users_by_ids(
        &self,
        user_ids: Vec<String>,
    ) -> Result<Vec<ReadUserAvatarDto>, UserError> {
        if user_ids.is_empty() {
            return Ok(vec![]);
        }

        let users = self
            .repo
            .filter_users(FilterUsersDto {
                id: Some(IdFilter::Many(user_ids)),
                ..Default::default()
            })
            .await
            .map_err(|e| UserError::UnknownError(e.to_string()))?;

        self.add_avatars(users).await
    }

    async fn add_avatars(&self, users: Vec<User>) -> Result<Vec<ReadUserAvatarDto>, UserError> {
        if users.is_empty() {
            return Ok(vec![]);
        }

        let ids: Vec<String> = users.iter().map(|user| user.id.clone()).collect();

        // Fetch user data from Clerk to get avatar URLs
        let clerk_users = clerk_rs::apis::users_api::User::get_user_list(
            &self.clerk,
            None,
            None,
            None,
            None,
            None,
            Some(ids),
            None,
            None,
            None,
            None,
            None,
        )
        .await
        .map_err(|e| {
            UserError::UnknownError(format!("Failed to fetch user data from Clerk: {}", e))
        })?;

        let avatar_map: HashMap<String, Option<String>> = clerk_users
            .into_iter()
            .map(|clerk_user| {
                let user_id = clerk_user.id.unwrap_or_default();
                let avatar_url = clerk_user.image_url;
                (user_id, avatar_url)
            })
            .collect();

        let result = users
            .into_iter()
            .map(|user| {
                let avatar_url = avatar_map.get(&user.id).and_then(|url| url.clone());
                ReadUserAvatarDto {
                    id: user.id,
                    username: user.username,
                    avatar_url,
                }
            })
            .collect();

        Ok(result)
    }
}
