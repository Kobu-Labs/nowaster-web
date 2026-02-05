use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::project::{
        create_project::CreateProjectDto,
        filter_project::FilterProjectDto,
        read_project::{ProjectStatsDto, ReadProjectDto, ReadProjectDetailsDto},
        update_project::UpdateProjectDto,
    },
    entity::project::Project,
    repository::project::{ProjectRepository, ProjectRepositoryTrait},
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct ProjectService {
    repo: ProjectRepository,
}

impl ProjectService {
    pub fn new(repo: ProjectRepository) -> Self {
        Self { repo }
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn create_project(
        &self,
        dto: CreateProjectDto,
        actor: Actor,
    ) -> Result<ReadProjectDto> {
        let res = self.repo.create(dto, actor).await?;
        Ok(ReadProjectDto::from(res))
    }

    #[instrument(err, skip(self), fields(project_id = %id, actor = %actor))]
    pub async fn delete_project(&self, id: Uuid, actor: Actor) -> Result<()> {
        self.repo.delete_project(id, actor).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn filter_projects(
        &self,
        filter: FilterProjectDto,
        actor: Actor,
    ) -> Result<Vec<ReadProjectDto>> {
        let res = self.repo.filter_projects(filter, actor).await?;
        Ok(res.into_iter().map(ReadProjectDto::from).collect())
    }

    #[instrument(err, skip(self), fields(project_id = %project_id, actor = %actor))]
    pub async fn get_by_id(&self, project_id: Uuid, actor: Actor) -> Result<Project> {
        self.repo.find_by_id(project_id, actor).await
    }

    #[instrument(err, skip(self), fields(project_id = %dto.id, actor = %actor))]
    pub async fn update_project(
        &self,
        dto: UpdateProjectDto,
        actor: Actor,
    ) -> Result<ReadProjectDto> {
        let project = self.repo.find_by_id(dto.id, actor.clone()).await?;
        if project.user_id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to update this project"
            ));
        }

        // Check if project is being marked as completed
        let was_completed = project.completed;
        let is_now_completed = dto.completed.unwrap_or(was_completed);

        let res = self.repo.update(dto, actor.clone()).await?;

        // If project was just completed, trigger notification
        // TODO: send notification
        if !was_completed && is_now_completed {
            // This will be implemented when we add notification service integration
            // For now, we'll just log it
            tracing::info!("Project {} was marked as completed", res.id);
        }

        Ok(ReadProjectDto::from(res))
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn get_projects_details(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadProjectDetailsDto>> {
        self.repo.get_projects_details(actor).await
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn get_project_statistics(&self, actor: Actor) -> Result<ProjectStatsDto> {
        self.repo.get_project_statistics(actor).await
    }
}
