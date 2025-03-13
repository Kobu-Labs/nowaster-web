use anyhow::Result;
use chrono::DateTime;
use uuid::Uuid;

use crate::{
    dto::session::{
        filter_session::{DateFilter, FilterSessionDto},
        fixed_session::{CreateFixedSessionDto, ReadFixedSessionDto},
    },
    repository::fixed_session::{FixedSessionRepository, SessionRepositoryTrait},
    router::clerk::ClerkUser,
};

use super::{category_service::CategoryService, tag_service::TagService};

#[derive(Clone)]
pub struct SessionService {
    fixed_repo: FixedSessionRepository,
    category_service: CategoryService,
    tag_service: TagService,
}

impl SessionService {
    pub fn new(
        repo: FixedSessionRepository,
        cat_serv: CategoryService,
        tag_serv: TagService,
    ) -> Self {
        Self {
            fixed_repo: repo,
            category_service: cat_serv,
            tag_service: tag_serv,
        }
    }

    pub async fn create_fixed_session(
        &self,
        dto: CreateFixedSessionDto,
        actor: ClerkUser,
    ) -> Result<ReadFixedSessionDto> {
        let category = self
            .category_service
            .upsert_category(dto.category.clone(), actor.clone())
            .await?;

        // TODO: this will be pulled from auth headers
        let res = self
            .fixed_repo
            .create(
                dto.clone(),
                category.id,
                dto.tags.iter().map(|t| t.id).collect(),
                actor.clone(),
            )
            .await?;

        Ok(ReadFixedSessionDto::from(res))
    }

    pub async fn filter_fixed_sessions(
        &self,
        dto: FilterSessionDto,
        actor: ClerkUser,
    ) -> Result<Vec<ReadFixedSessionDto>> {
        let res = self.fixed_repo.filter_sessions(dto, actor).await?;
        Ok(res.into_iter().map(ReadFixedSessionDto::from).collect())
    }

    pub async fn delete_session(&self, id: Uuid, actor: ClerkUser) -> Result<()> {
        self.fixed_repo.delete_session(id, actor).await?;
        Ok(())
    }

    pub async fn get_active_sessions(&self, actor: ClerkUser) -> Result<Vec<ReadFixedSessionDto>> {
        let now = chrono::Local::now();
        let active_session_filter: FilterSessionDto = FilterSessionDto {
            from_end_time: Some(DateFilter {
                value: DateTime::from(now),
            }),

            to_start_time: Some(DateFilter {
                value: DateTime::from(now),
            }),
            ..Default::default()
        };

        let res = self
            .fixed_repo
            .filter_sessions(active_session_filter, actor)
            .await?;
        Ok(res.into_iter().map(ReadFixedSessionDto::from).collect())
    }
}
