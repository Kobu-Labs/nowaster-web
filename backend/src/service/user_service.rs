use anyhow::Result;
use tracing::instrument;

use crate::{
    dto::{
        feed::AddFeedSource,
        user::{
            read_user::ReadUserDto, update_user::UpdateUserDto,
            update_visibility::UpdateVisibilityDto,
        },
    },
    repository::user::{FilterUsersDto, IdFilter, UserRepository},
    router::{clerk::Actor, user::root::UserError},
    service::feed::{subscriptions::FeedSubscriptionService, visibility::FeedVisibilityService},
};

#[derive(Clone)]
pub struct UserService {
    repo: UserRepository,
    visibility_service: FeedVisibilityService,
    subscription_service: FeedSubscriptionService,
}

impl UserService {
    pub fn new(
        repo: UserRepository,
        visibility_service: FeedVisibilityService,
        subscription_service: FeedSubscriptionService,
    ) -> Self {
        Self {
            repo,
            visibility_service,
            subscription_service,
        }
    }

    #[instrument(err, skip(self))]
    pub async fn update_user(&self, dto: UpdateUserDto) -> Result<ReadUserDto, UserError> {
        let res = self.repo.update(dto).await;
        match res {
            Ok(u) => Ok(ReadUserDto::from(u)),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }

    #[instrument(err, skip(self), fields(username = %username))]
    pub async fn get_user_by_name(
        &self,
        username: String,
    ) -> Result<Option<ReadUserDto>, UserError> {
        let user = self
            .repo
            .filter_users(FilterUsersDto {
                name: Some(username),
                ..Default::default()
            })
            .await
            .map_err(|e| UserError::UnknownError(e.to_string()))?;

        Ok(user.first().cloned().map(Into::into))
    }

    #[instrument(err, skip(self), fields(actor_id = %actor_id))]
    pub async fn get_actor_by_id(&self, actor_id: String) -> Result<Option<(Actor, String)>> {
        // INFO: right now only user can be an actor
        self.repo.get_actor_by_id(actor_id).await
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn get_user_by_id(&self, user_id: String) -> Result<Option<ReadUserDto>, UserError> {
        let user = self
            .repo
            .filter_users(FilterUsersDto {
                id: Some(IdFilter::Single(user_id)),
                ..Default::default()
            })
            .await
            .map_err(|e| UserError::UnknownError(e.to_string()))?;

        Ok(user.first().cloned().map(Into::into))
    }

    #[instrument(err, skip(self), fields(user_ids_count = user_ids.len()))]
    pub async fn get_users_by_ids(
        &self,
        user_ids: Vec<String>,
    ) -> Result<Vec<ReadUserDto>, UserError> {
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

        Ok(users.iter().cloned().map(Into::into).collect())
    }

    #[instrument(err, skip(self), fields(user_id = %user_id))]
    pub async fn update_visibility(
        &self,
        user_id: String,
        dto: UpdateVisibilityDto,
    ) -> Result<ReadUserDto, UserError> {
        let res = self.repo.update_visibility(user_id.clone(), dto).await;

        self.visibility_service
            .recalculate_visibility(user_id)
            .await;
        match res {
            Ok(u) => Ok(ReadUserDto::from(u)),
            Err(e) => Err(UserError::UnknownError(e.to_string())),
        }
    }

    #[instrument(err, skip(self))]
    pub async fn search_users(
        &self,
        query: &str,
        limit: i64,
    ) -> Result<Vec<ReadUserDto>, UserError> {
        let users = self
            .repo
            .filter_users(FilterUsersDto {
                id: Some(IdFilter::Single(query.to_string())),
                name: Some(query.to_string()),
            })
            .await
            .map_err(|e| UserError::UnknownError(e.to_string()))?;

        Ok(users.iter().cloned().map(Into::into).collect())
    }
}
