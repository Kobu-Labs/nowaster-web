use anyhow::Result;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::task::{
        create_task::CreateTaskDto,
        filter_task::FilterTaskDto,
        read_task::{ReadTaskDetailsDto, TaskStatsDto},
        update_task::UpdateTaskDto,
    },
    entity::task::Task,
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct TaskRepository {
    db_conn: Arc<Database>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug)]
pub struct ReadTaskRow {
    id: Uuid,
    project_id: Uuid,
    name: String,
    description: Option<String>,
    completed: bool,
    user_id: String,
    created_at: DateTime<Local>,
    updated_at: DateTime<Local>,
}

pub trait TaskRepositoryTrait {
    async fn create(&self, dto: CreateTaskDto, actor: Actor) -> Result<Task>;
    async fn update(&self, dto: UpdateTaskDto, actor: Actor) -> Result<Task>;
    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Task>;
    async fn delete_task(&self, id: Uuid, actor: Actor) -> Result<()>;
    async fn filter_tasks(&self, filter: FilterTaskDto, actor: Actor) -> Result<Vec<Task>>;
    async fn get_task_statistics(&self, actor: Actor) -> Result<TaskStatsDto>;
    async fn get_tasks_details_by_ids(
        &self,
        task_ids: Vec<Uuid>,
        actor: Actor,
    ) -> Result<Vec<ReadTaskDetailsDto>>;
    fn new(db_conn: &Arc<Database>) -> Self;
    fn mapper(&self, row: ReadTaskRow) -> Task;
}

impl TaskRepositoryTrait for TaskRepository {
    fn new(db_conn: &Arc<Database>) -> Self {
        Self {
            db_conn: Arc::clone(db_conn),
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor, task_name = %dto.name))]
    async fn create(&self, dto: CreateTaskDto, actor: Actor) -> Result<Task> {
        let row = sqlx::query_as!(
            ReadTaskRow,
            r#"
                INSERT INTO task (project_id, name, description, user_id)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    project_id,
                    name,
                    description,
                    completed,
                    user_id,
                    created_at,
                    updated_at
            "#,
            dto.project_id,
            dto.name,
            dto.description,
            actor.user_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    fn mapper(&self, row: ReadTaskRow) -> Task {
        Task {
            id: row.id,
            project_id: row.project_id,
            name: row.name,
            description: row.description,
            completed: row.completed,
            user_id: row.user_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    async fn filter_tasks(&self, filter: FilterTaskDto, actor: Actor) -> Result<Vec<Task>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            "
                SELECT
                    task.id,
                    task.project_id,
                    task.name,
                    task.description,
                    task.completed,
                    task.user_id,
                    task.created_at,
                    task.updated_at
                FROM task
                WHERE task.user_id =
            ",
        );
        query.push_bind(actor.user_id);

        if let Some(name) = filter.name {
            query.push(" AND task.name = ").push_bind(name);
        }

        if let Some(id) = filter.id {
            query.push(" AND task.id = ").push_bind(id);
        }

        if let Some(project_id) = filter.project_id {
            query.push(" AND task.project_id = ").push_bind(project_id);
        }

        if let Some(completed) = filter.completed {
            query.push(" AND task.completed = ").push_bind(completed);
        }

        query.push(" ORDER BY task.completed ASC, task.updated_at DESC");

        let rows = query
            .build_query_as::<ReadTaskRow>()
            .fetch_all(self.db_conn.get_pool())
            .await?;

        Ok(rows.into_iter().map(|row| self.mapper(row)).collect())
    }

    #[instrument(err, skip(self), fields(task_id = %id, actor_id = %actor))]
    async fn delete_task(&self, id: Uuid, actor: Actor) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM task
                WHERE task.id = $1 AND task.user_id = $2
            "#,
            id,
            actor.user_id
        )
        .execute(self.db_conn.get_pool())
        .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(task_id = %id, actor_id = %actor))]
    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Task> {
        let result = self
            .filter_tasks(
                FilterTaskDto {
                    id: Some(id),
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

    #[instrument(err, skip(self), fields(task_id = %dto.id, actor_id = %actor))]
    async fn update(&self, dto: UpdateTaskDto, actor: Actor) -> Result<Task> {
        let row = sqlx::query_as!(
            ReadTaskRow,
            r#"
                UPDATE task t
                SET
                    name = COALESCE($2, t.name),
                    description = COALESCE($3, t.description),
                    completed = COALESCE($4, t.completed)
                WHERE
                    t.id = $1
                    AND t.user_id = $5
                RETURNING 
                    t.id, 
                    t.project_id, 
                    t.name, 
                    t.description, 
                    t.completed, 
                    t.user_id, 
                    t.created_at, 
                    t.updated_at
            "#,
            dto.id,
            dto.name,
            dto.description,
            dto.completed,
            actor.user_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    async fn get_task_statistics(&self, actor: Actor) -> Result<TaskStatsDto> {
        let stats = sqlx::query_as!(
            TaskStatsDto,
            r#"
                SELECT
                    COUNT(t.id) as "total_tasks!",
                    COUNT(CASE WHEN t.completed = false THEN 1 END) as "active_tasks!",
                    COUNT(CASE WHEN t.completed = true THEN 1 END) as "completed_tasks!",
                    COUNT(DISTINCT s.id) as "total_sessions!",
                    CAST(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60.0) AS DOUBLE PRECISION) as "total_time_minutes"
                FROM task t
                LEFT JOIN session s ON s.task_id = t.id
                WHERE t.user_id = $1
            "#,
            actor.user_id
        )
        .fetch_one(self.db_conn.get_pool())
        .await?;

        Ok(stats)
    }

    #[instrument(err, skip(self, task_ids), fields(actor_id = %actor, task_count = task_ids.len()))]
    async fn get_tasks_details_by_ids(
        &self,
        task_ids: Vec<Uuid>,
        actor: Actor,
    ) -> Result<Vec<ReadTaskDetailsDto>> {
        if task_ids.is_empty() {
            return Ok(Vec::new());
        }

        let rows = sqlx::query_as!(
            ReadTaskDetailsDto,
            r#"
                SELECT
                    t.id,
                    t.project_id,
                    t.name,
                    t.description,
                    t.completed,
                    t.created_at,
                    t.updated_at,
                    COUNT(s.id) as "session_count!",
                    CAST(COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60), 0.0) AS DOUBLE PRECISION) as "total_time_minutes!"
                FROM task t
                LEFT JOIN session s ON s.task_id = t.id
                WHERE t.id = ANY($1) AND t.user_id = $2
                GROUP BY t.id, t.project_id, t.name, t.description, t.completed, t.user_id, t.created_at, t.updated_at
                ORDER BY t.completed ASC, t.updated_at DESC
            "#,
            &task_ids,
            actor.user_id
        )
        .fetch_all(self.db_conn.get_pool())
        .await?;

        Ok(rows)
    }
}
