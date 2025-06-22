use anyhow::Result;

use crate::{
    dto::session::template::CreateSessionTemplateDto,
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
}
