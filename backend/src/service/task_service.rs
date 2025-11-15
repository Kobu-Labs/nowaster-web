use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::repository::project::ProjectRepository;
use crate::{
    dto::{
        feed::CreateFeedEventDto,
        task::{
            create_task::CreateTaskDto,
            filter_task::FilterTaskDto,
            read_task::{ReadTaskDetailsDto, ReadTaskDto, TaskStatsDto},
            update_task::UpdateTaskDto,
        },
    },
    entity::{
        feed::{FeedEventSource, FeedEventType, FeedProject, TaskEventData},
        task::Task,
    },
    repository::{
        project::ProjectRepositoryTrait,
        task::{TaskRepository, TaskRepositoryTrait},
    },
    router::clerk::Actor,
    service::{feed::events::FeedEventService, user_service::UserService},
};

#[derive(Clone)]
pub struct TaskService {
    repo: TaskRepository,
    project_repo: ProjectRepository,
    event_service: FeedEventService,
    user_service: UserService,
}

impl TaskService {
    pub fn new(
        repo: TaskRepository,
        project_repo: ProjectRepository,
        event_service: FeedEventService,
        user_service: UserService,
    ) -> Self {
        Self {
            repo,
            project_repo,
            event_service,
            user_service,
        }
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn create_task(&self, dto: CreateTaskDto, actor: Actor) -> Result<ReadTaskDto> {
        let res = self.repo.create(dto, actor).await?;
        Ok(ReadTaskDto::from(res))
    }

    #[instrument(err, skip(self), fields(task_id = %id, actor = %actor))]
    pub async fn delete_task(&self, id: Uuid, actor: Actor) -> Result<()> {
        self.repo.delete_task(id, actor).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn filter_tasks(
        &self,
        filter: FilterTaskDto,
        actor: Actor,
    ) -> Result<Vec<ReadTaskDto>> {
        let res = self.repo.filter_tasks(filter, actor).await?;
        Ok(res.into_iter().map(ReadTaskDto::from).collect())
    }

    #[instrument(err, skip(self), fields(project_id = %project_id, actor = %actor))]
    pub async fn get_tasks_by_project(
        &self,
        project_id: Uuid,
        actor: Actor,
    ) -> Result<Vec<ReadTaskDetailsDto>> {
        let project_tasks = self
            .repo
            .filter_tasks(
                FilterTaskDto {
                    id: None,
                    project_id: Some(project_id),
                    name: None,
                    completed: None,
                },
                actor.clone(),
            )
            .await?;

        let task_ids: Vec<Uuid> = project_tasks.iter().map(|task| task.id).collect();
        self.repo
            .get_tasks_details_by_ids(task_ids, actor.clone())
            .await
    }

    #[instrument(err, skip(self), fields(task_id = %task_id, actor = %actor))]
    pub async fn get_by_id(&self, task_id: Uuid, actor: Actor) -> Result<Task> {
        let result = self
            .repo
            .filter_tasks(
                FilterTaskDto {
                    id: Some(task_id),
                    project_id: None,
                    name: None,
                    completed: None,
                },
                actor,
            )
            .await?;

        if let Some(task) = result.first() {
            return Ok(task.clone());
        }

        Err(anyhow::anyhow!("Task not found"))
    }

    #[instrument(err, skip(self), fields(task_id = %dto.id, actor = %actor))]
    pub async fn update_task(&self, dto: UpdateTaskDto, actor: Actor) -> Result<ReadTaskDto> {
        let task = self.repo.find_by_id(dto.id, actor.clone()).await?;
        if task.user_id != actor.user_id {
            return Err(anyhow::anyhow!("You are not allowed to update this task"));
        }

        // Check if task is being marked as completed
        let was_completed = task.completed;
        let is_now_completed = dto.completed.unwrap_or(was_completed);

        let res = self.repo.update(dto, actor.clone()).await?;

        // If task was just completed, publish feed event
        if !was_completed && is_now_completed {
            tracing::info!("Task {} was marked as completed", res.id);

            let task_details = self
                .repo
                .get_tasks_details_by_ids(vec![res.id], actor.clone())
                .await?;

            if let Some(task_detail) = task_details.first() {
                let project = self
                    .project_repo
                    .find_by_id(res.project_id, actor.clone())
                    .await?;

                let user = self
                    .user_service
                    .get_user_by_id(actor.user_id.clone())
                    .await?
                    .ok_or_else(|| anyhow::anyhow!("User not found"))?;

                self.event_service
                    .publish_event(CreateFeedEventDto {
                        id: None,
                        data: FeedEventType::TaskCompleted(TaskEventData {
                            task_id: res.id,
                            task_name: res.name.clone(),
                            task_description: res.description.clone(),
                            hours_of_work: task_detail.total_time_minutes as f64 / 60.0,
                            project: FeedProject {
                                id: project.id,
                                name: project.name.clone(),
                                color: project.color.clone(),
                                image_url: project.image_url.clone(),
                            },
                        }),
                        source: FeedEventSource::User(user),
                    })
                    .await?;
            }
        }

        Ok(ReadTaskDto::from(res))
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn get_task_statistics(&self, actor: Actor) -> Result<TaskStatsDto> {
        self.repo.get_task_statistics(actor).await
    }
}
