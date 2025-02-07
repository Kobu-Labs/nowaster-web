use anyhow::Result;
use chrono::DateTime;
use uuid::Uuid;

use crate::{
    dto::{
        category::create_category::CreateCategoryDto,
        session::{
            filter_session::{DateFilter, FilterSessionDto},
            fixed_session::{CreateFixedSessionDto, ReadFixedSessionDto},
        },
        tag::create_tag::CreateTagDto,
    },
    repository::fixed_session::{FixedSessionRepository, SessionRepositoryTrait},
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
    ) -> Result<ReadFixedSessionDto> {
        let mut tag_ids = vec![];
        for tag in dto.tags.clone() {
            let tag_id = self.tag_service.upsert_tag(tag).await?;
            tag_ids.push(tag_id.id);
        }

        let category = self
            .category_service
            .upsert_category(dto.category.clone())
            .await?;

        // TODO: this will be pulled from auth headers
        let user_id = dto.user_id;
        let res = self
            .fixed_repo
            .create(dto, user_id, category.id, tag_ids)
            .await?;

        Ok(ReadFixedSessionDto::from(res))
    }

    pub async fn filter_fixed_sessions(
        &self,
        dto: FilterSessionDto,
    ) -> Result<Vec<ReadFixedSessionDto>> {
        let res = self.fixed_repo.filter_sessions(dto).await?;
        Ok(res.into_iter().map(ReadFixedSessionDto::from).collect())
    }

    pub async fn delete_session(&self, id: Uuid) -> Result<()> {
        self.fixed_repo.delete_session(id).await?;
        Ok(())
    }

    pub async fn get_active_sessions(&self) -> Result<Vec<ReadFixedSessionDto>> {
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
            .filter_sessions(active_session_filter)
            .await?;
        Ok(res.into_iter().map(ReadFixedSessionDto::from).collect())
    }
}
