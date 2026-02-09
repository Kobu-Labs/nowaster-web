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
        session::filter_session::FilterSessionDto,
    },
    entity::{
        feed::{CategoryTimeBreakdown, FeedEventSource, FeedEventType, ProjectEventData, TaskTimeBreakdown},
        project::Project,
    },
    repository::{
        fixed_session::SessionRepositoryTrait,
        project::{ProjectRepository, ProjectRepositoryTrait},
    },
    router::clerk::Actor,
    service::{feed::events::FeedEventService, session::fixed::FixedSessionService, task_service::TaskService, user_service::UserService},
};

#[derive(Clone)]
pub struct ProjectService {
    repo: ProjectRepository,
    event_service: FeedEventService,
    user_service: UserService,
    task_service: TaskService,
    session_service: FixedSessionService,
}

impl ProjectService {
    pub fn new(
        repo: ProjectRepository,
        event_service: FeedEventService,
        user_service: UserService,
        task_service: TaskService,
        session_service: FixedSessionService,
    ) -> Self {
        Self {
            repo,
            event_service,
            user_service,
            task_service,
            session_service,
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
                    minutes: task.total_time_minutes,
                })
                .collect();

            // Get sessions for this project to calculate category breakdown
            let sessions = self
                .session_service
                .filter_fixed_sessions(
                    FilterSessionDto {
                        project_id: Some(res.id),
                        ..Default::default()
                    },
                    actor.clone(),
                )
                .await?;

            // Calculate time per category
            let total_sessions = sessions.len() as i64;
            let mut category_map: std::collections::HashMap<Uuid, (String, String, f64)> =
                std::collections::HashMap::new();

            for session in sessions {
                let duration_minutes =
                    (session.end_time - session.start_time).num_minutes() as f64;
                category_map
                    .entry(session.category.id)
                    .and_modify(|(_, _, minutes)| *minutes += duration_minutes)
                    .or_insert((
                        session.category.name.clone(),
                        session.category.color.clone(),
                        duration_minutes,
                    ));
            }

            let categories_time_breakdown: Vec<CategoryTimeBreakdown> = category_map
                .into_iter()
                .map(|(id, (name, color, minutes))| CategoryTimeBreakdown {
                    category_id: id,
                    category_name: name,
                    category_color: color,
                    minutes,
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
                        project_color: res.color.clone(),
                        project_image_url: res.image_url.clone(),
                        created_at: res.created_at,
                        total_sessions,
                        tasks_time_breakdown,
                        categories_time_breakdown,
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
