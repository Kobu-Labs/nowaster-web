use anyhow::Result;
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, QueryBuilder};
use std::sync::Arc;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    config::database::{Database, DatabaseTrait},
    dto::project::{
        create_project::CreateProjectDto,
        filter_project::FilterProjectDto,
        read_project::{ProjectStatsDto, ReadProjectWithTaskCountDto},
        update_project::UpdateProjectDto,
    },
    entity::project::Project,
    router::clerk::Actor,
};

#[derive(Clone)]
pub struct ProjectRepository {
    db: Arc<Database>,
}

#[derive(sqlx::FromRow, Serialize, Deserialize, Debug)]
pub struct ReadProjectRow {
    id: Uuid,
    name: String,
    description: Option<String>,
    image_url: Option<String>,
    color: String,
    completed: bool,
    user_id: String,
    created_at: DateTime<Local>,
    updated_at: DateTime<Local>,
}

pub trait ProjectRepositoryTrait {
    async fn create(&self, dto: CreateProjectDto, actor: Actor) -> Result<Project>;
    async fn update(&self, dto: UpdateProjectDto, actor: Actor) -> Result<Project>;
    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Project>;
    async fn delete_project(&self, id: Uuid, actor: Actor) -> Result<()>;
    async fn filter_projects(&self, filter: FilterProjectDto, actor: Actor)
        -> Result<Vec<Project>>;
    async fn get_projects_with_task_count(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadProjectWithTaskCountDto>>;
    async fn get_project_statistics(&self, actor: Actor) -> Result<ProjectStatsDto>;
    fn new(db: &Arc<Database>) -> Self;
    fn mapper(&self, row: ReadProjectRow) -> Project;
}

impl ProjectRepositoryTrait for ProjectRepository {
    fn new(db: &Arc<Database>) -> Self {
        Self { db: Arc::clone(db) }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor, project_name = %dto.name))]
    async fn create(&self, dto: CreateProjectDto, actor: Actor) -> Result<Project> {
        let row = sqlx::query_as!(
            ReadProjectRow,
            r#"
                INSERT INTO project (name, description, image_url, color, user_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    id,
                    name,
                    description,
                    image_url,
                    color,
                    completed,
                    user_id,
                    created_at,
                    updated_at
            "#,
            dto.name,
            dto.description,
            dto.image_url,
            dto.color,
            actor.user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(self.mapper(row))
    }

    fn mapper(&self, row: ReadProjectRow) -> Project {
        Project {
            id: row.id,
            name: row.name,
            description: row.description,
            image_url: row.image_url,
            color: row.color,
            completed: row.completed,
            user_id: row.user_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    async fn filter_projects(
        &self,
        filter: FilterProjectDto,
        actor: Actor,
    ) -> Result<Vec<Project>> {
        let mut query: QueryBuilder<'_, Postgres> = QueryBuilder::new(
            "
                SELECT
                    project.id,
                    project.name,
                    project.description,
                    project.image_url,
                    project.color,
                    project.completed,
                    project.user_id,
                    project.created_at,
                    project.updated_at
                FROM project
                WHERE project.user_id =
            ",
        );
        query.push_bind(actor.user_id);

        if let Some(name) = filter.name {
            query.push(" AND project.name = ").push_bind(name);
        }

        if let Some(id) = filter.id {
            query.push(" AND project.id = ").push_bind(id);
        }

        if let Some(completed) = filter.completed {
            query.push(" AND project.completed = ").push_bind(completed);
        }

        query.push(" ORDER BY project.completed ASC, project.updated_at DESC");

        let rows = query
            .build_query_as::<ReadProjectRow>()
            .fetch_all(self.db.get_pool())
            .await?;

        Ok(rows.into_iter().map(|row| self.mapper(row)).collect())
    }

    #[instrument(err, skip(self), fields(project_id = %id, actor_id = %actor))]
    async fn delete_project(&self, id: Uuid, actor: Actor) -> Result<()> {
        sqlx::query!(
            r#"
                DELETE FROM project
                WHERE project.id = $1 AND project.user_id = $2
            "#,
            id,
            actor.user_id
        )
        .execute(self.db.get_pool())
        .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(project_id = %id, actor_id = %actor))]
    async fn find_by_id(&self, id: Uuid, actor: Actor) -> Result<Project> {
        let result = self
            .filter_projects(
                FilterProjectDto {
                    id: Some(id),
                    name: None,
                    completed: None,
                },
                actor,
            )
            .await?;

        if let Some(project) = result.first() {
            return Ok(project.clone());
        }
        Err(anyhow::anyhow!("Project not found"))
    }

    #[instrument(err, skip(self), fields(project_id = %dto.id, actor_id = %actor))]
    async fn update(&self, dto: UpdateProjectDto, actor: Actor) -> Result<Project> {
        let result = sqlx::query_as!(
            ReadProjectRow,
            r#"
                UPDATE project p
                SET
                    name = COALESCE($2, name),
                    description = COALESCE($3, description),
                    image_url = COALESCE($4, image_url),
                    color = COALESCE($5, color),
                    completed = COALESCE($6, completed)
                WHERE id = $1
                    AND user_id = $7
                RETURNING 
                    id, 
                    name,
                    description, 
                    image_url, 
                    color, 
                    completed, 
                    user_id, 
                    created_at, 
                    updated_at
            "#,
            dto.id,
            dto.name,
            dto.description,
            dto.image_url,
            dto.color,
            dto.completed,
            actor.user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(self.mapper(result))
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    async fn get_projects_with_task_count(
        &self,
        actor: Actor,
    ) -> Result<Vec<ReadProjectWithTaskCountDto>> {
        let rows = sqlx::query_as!(
            ReadProjectWithTaskCountDto,
            r#"
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.image_url,
                    p.color,
                    p.completed,
                    COUNT(t.id) as "task_count!",
                    COUNT(CASE WHEN t.completed = true THEN 1 END) as "completed_task_count!",
                    p.created_at,
                    p.updated_at
                FROM project p
                LEFT JOIN task t ON t.project_id = p.id
                WHERE p.user_id = $1
                GROUP BY p.id
                ORDER BY p.completed ASC, p.updated_at DESC
            "#,
            actor.user_id
        )
        .fetch_all(self.db.get_pool())
        .await?;

        Ok(rows)
    }

    #[instrument(err, skip(self), fields(actor_id = %actor))]
    async fn get_project_statistics(&self, actor: Actor) -> Result<ProjectStatsDto> {
        let stats = sqlx::query_as!(
            ProjectStatsDto,
            r#"
                SELECT
                    COUNT(DISTINCT p.id) as "total_projects!",
                    COUNT(DISTINCT CASE WHEN p.completed = false THEN p.id END) as "active_projects!",
                    COUNT(DISTINCT CASE WHEN p.completed = true THEN p.id END) as "completed_projects!",
                    COUNT(DISTINCT t.id) as "total_tasks!",
                    COUNT(DISTINCT s.id) as "total_sessions!",
                    CAST(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60.0) AS DOUBLE PRECISION) as "total_time_minutes"
                FROM project p
                LEFT JOIN task t ON t.project_id = p.id
                LEFT JOIN session s ON s.task_id = t.id
                WHERE p.user_id = $1
            "#,
            actor.user_id
        )
        .fetch_one(self.db.get_pool())
        .await?;

        Ok(stats)
    }
}
