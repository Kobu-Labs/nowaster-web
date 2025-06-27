use anyhow::Result;
use uuid::Uuid;

use crate::{
    dto::session::template::{CreateSessionTemplateDto, UpdateRecurringSessionDto},
    repository::recurring_session::{ReadSesionTemplateRow, RecurringSessionRepository},
    router::clerk::ClerkUser,
};

#[derive(Clone)]
pub struct SessionTemplateService {
    repo: RecurringSessionRepository,
}

impl SessionTemplateService {
    pub fn new(repo: RecurringSessionRepository) -> Self {
        Self { repo }
    }

    pub async fn get_templates(&self, actor: ClerkUser) -> Result<Vec<ReadSesionTemplateRow>> {
        self.repo.get_recurring_sessions(actor).await
    }

    pub async fn create_template(
        &self,
        dto: CreateSessionTemplateDto,
        actor: ClerkUser,
    ) -> Result<()> {
        self.repo.create_session_template(dto, actor).await
    }

    pub async fn update_recurring_session(
        &self,
        dto: UpdateRecurringSessionDto,
        actor: ClerkUser,
    ) -> Result<()> {
        self.repo.update_recurring_session(dto, actor).await
    }

    pub async fn delete_recurring_session(
        &self,
        id: Uuid,
        actor: ClerkUser,
    ) -> Result<()> {
        self.repo.delete_recurring_session(id, actor).await
    }

    pub async fn delete_session_template(
        &self,
        id: Uuid,
        actor: ClerkUser,
    ) -> Result<()> {
        self.repo.delete_session_template(id, actor).await
    }
}
