use anyhow::Result;
use chrono::{DateTime, Duration, Local};
use uuid::Uuid;

use crate::{
    dto::session::{
        fixed_session::CreateFixedSessionDto,
        template::{CreateSessionTemplateDto, UpdateSessionTemplateDto},
    },
    entity::session_template::RecurringSessionInterval,
    repository::{
        fixed_session::{FixedSessionRepository, SessionRepositoryTrait},
        session_template::{ReadSesionTemplateRow, RecurringSessionRepository},
    },
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct SessionTemplateService {
    repo: RecurringSessionRepository,
    session_repo: FixedSessionRepository,
}

pub fn increment_by_interval(
    date: DateTime<Local>,
    interval: RecurringSessionInterval,
) -> DateTime<Local> {
    match interval {
        RecurringSessionInterval::Daily => date + Duration::days(1),
        RecurringSessionInterval::Weekly => date + Duration::weeks(1),
        RecurringSessionInterval::Monthly => todo!(),
        RecurringSessionInterval::BiWeekly => todo!(),
    }
}

impl SessionTemplateService {
    pub fn new(repo: RecurringSessionRepository, session_repo: FixedSessionRepository) -> Self {
        Self { repo, session_repo }
    }

    pub async fn get_templates(&self, actor: ClerkUser) -> Result<Vec<ReadSesionTemplateRow>> {
        self.repo.get_recurring_sessions(actor).await
    }

    pub async fn create_template(
        &self,
        dto: CreateSessionTemplateDto,
        actor: ClerkUser,
    ) -> Result<()> {
        let template_id = Uuid::new_v4();
        self.repo
            .create_session_template(template_id, dto.clone(), actor.clone())
            .await?;
        let mut sessions: Vec<CreateFixedSessionDto> = Vec::new();

        dto.clone().sessions.iter().for_each(|session| {
            let mut current_date =
                dto.start_date + Duration::minutes(session.start_minute_offset as i64);
            let mut end_date = dto.start_date + Duration::minutes(session.end_minute_offset as i64);

            while current_date <= dto.end_date {
                let new_session: CreateFixedSessionDto = CreateFixedSessionDto {
                    category_id: session.category_id,
                    tag_ids: session.tag_ids.clone(),
                    description: session.description.clone(),
                    start_time: current_date,
                    end_time: end_date,
                    template_id: Some(template_id),
                };
                sessions.push(new_session);

                end_date = increment_by_interval(end_date, dto.interval.clone());
                current_date = increment_by_interval(current_date, dto.interval.clone());
            }
        });

        if !sessions.is_empty() {
            self.session_repo.create_many(sessions, actor).await?;
        }

        Ok(())
    }

    pub async fn update_session_template(
        &self,
        dto: UpdateSessionTemplateDto,
        actor: ClerkUser,
    ) -> Result<()> {
        self.repo.update_session_template(dto, actor).await
    }

    pub async fn delete_recurring_session(&self, id: Uuid, actor: ClerkUser) -> Result<()> {
        self.repo.delete_recurring_session(id, actor).await
    }

    pub async fn delete_session_template(&self, id: Uuid, actor: ClerkUser) -> Result<()> {
        self.repo.delete_session_template(id, actor).await
    }
}
