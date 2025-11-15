use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::{
        feed::CreateFeedEventDto,
        project::{
            create_project::CreateProjectDto,
            filter_project::FilterProjectDto,
            read_project::{ProjectStatsDto, ReadProjectDto, ReadProjectDetailsDto},
            update_project::UpdateProjectDto,
        },
    },
    entity::{
        feed::{FeedEventSource, FeedEventType, ProjectEventData, TaskTimeBreakdown},
        project::Project,
    },
    repository::project::{ProjectRepository, ProjectRepositoryTrait},
    router::clerk::Actor,
    service::{feed::events::FeedEventService, task_service::TaskService, user_service::UserService},
};

#[derive(Clone)]
pub struct ProjectService {
    repo: ProjectRepository,
    event_service: FeedEventService,
    user_service: UserService,
    task_service: TaskService,
}

impl ProjectService {
    pub fn new(
        repo: ProjectRepository,
        event_service: FeedEventService,
        user_service: UserService,
        task_service: TaskService,
    ) -> Self {
        Self {
            repo,
            event_service,
            user_service,
            task_service,
        }
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

        // If project was just completed, publish feed event
        if !was_completed && is_now_completed {
            tracing::info!("Project {} was marked as completed", res.id);

            let tasks = self
                .task_service
                .get_tasks_by_project(res.id, actor.clone())
                .await?;

            let tasks_time_breakdown: Vec<TaskTimeBreakdown> = tasks
                .iter()
                .map(|task| TaskTimeBreakdown {
                    task_id: task.id,
                    task_name: task.name.clone(),
                    hours: task.total_time_minutes as f64 / 60.0,
                })
                .collect();

            let user = self
                .user_service
                .get_user_by_id(actor.user_id.clone())
                .await?
                .ok_or_else(|| anyhow::anyhow!("User not found"))?;

            // Publish feed event
            self.event_service
                .publish_event(CreateFeedEventDto {
                    id: None,
                    data: FeedEventType::ProjectCompleted(ProjectEventData {
                        project_id: res.id,
                        project_name: res.name.clone(),
                        project_description: res.description.clone(),
                        project_color: res.color.clone(),
                        project_image_url: res.image_url.clone(),
                        tasks_time_breakdown,
                    }),
                    source: FeedEventSource::User(user),
                })
                .await?;
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
