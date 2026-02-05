use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::task::{
        create_task::CreateTaskDto,
        filter_task::FilterTaskDto,
        read_task::{ReadTaskDto, TaskStatsDto},
        update_task::UpdateTaskDto,
    },
    entity::task::Task,
    repository::task::{TaskRepository, TaskRepositoryTrait},
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct TaskService {
    repo: TaskRepository,
}

impl TaskService {
    pub fn new(repo: TaskRepository) -> Self {
        Self { repo }
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
    ) -> Result<Vec<ReadTaskDto>> {
        let res = self.repo.get_tasks_by_project(project_id, actor).await?;
        Ok(res.into_iter().map(ReadTaskDto::from).collect())
    }

    #[instrument(err, skip(self), fields(task_id = %task_id, actor = %actor))]
    pub async fn get_by_id(&self, task_id: Uuid, actor: Actor) -> Result<Task> {
        self.repo.find_by_id(task_id, actor).await
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

        // If task was just completed, trigger notification
        // TODO: send notification
        if !was_completed && is_now_completed {
            // This will be implemented when we add notification service integration
            // For now, we'll just log it
            tracing::info!("Task {} was marked as completed", res.id);
        }

        Ok(ReadTaskDto::from(res))
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn get_task_statistics(&self, actor: Actor) -> Result<TaskStatsDto> {
        self.repo.get_task_statistics(actor).await
    }
}
