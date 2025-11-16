use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::user::read_user::ReadUserDto;
use crate::entity::category::Category;
use crate::entity::tag::Tag;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "event_type", content = "event_data", rename_all = "snake_case")]
pub enum FeedEventType {
    SessionCompleted(SessionEventData),
    TaskCompleted(TaskEventData),
    ProjectCompleted(ProjectEventData),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(
    tag = "source_type",
    content = "source_data",
    rename_all = "snake_case"
)]
pub enum FeedEventSource {
    User(ReadUserDto),
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedEvent {
    pub id: Uuid,
    #[serde(flatten)]
    pub source: FeedEventSource,
    #[serde(flatten)]
    pub data: FeedEventType,
    pub created_at: DateTime<Local>,
}

// possible events
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SessionEventData {
    pub session_id: Uuid,
    pub category: FeedSessionCategory,
    pub tags: Vec<FeedSessionTag>,
    pub description: Option<String>,
    pub start_time: DateTime<Local>,
    pub end_time: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TaskEventData {
    pub task_id: Uuid,
    pub task_name: String,
    pub task_description: Option<String>,
    pub hours_of_work: f64,
    pub project: FeedProject,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ProjectEventData {
    pub project_id: Uuid,
    pub project_name: String,
    pub project_description: Option<String>,
    pub project_color: String,
    pub project_image_url: Option<String>,
    pub tasks_time_breakdown: Vec<TaskTimeBreakdown>,
    pub categories_time_breakdown: Vec<CategoryTimeBreakdown>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct TaskTimeBreakdown {
    pub task_id: Uuid,
    pub task_name: String,
    pub minutes: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CategoryTimeBreakdown {
    pub category_id: Uuid,
    pub category_name: String,
    pub category_color: String,
    pub minutes: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedReaction {
    pub id: Uuid,
    pub feed_event_id: Uuid,
    pub user: ReadUserDto,
    pub emoji: String,
    pub created_at: DateTime<Local>,
}

// INFO: mock objects to prevent growing dependencies
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedSessionCategory {
    pub id: Uuid,
    pub name: String,
    pub color: String,
}

// INFO: mock objects to prevent growing dependencies
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedSessionTag {
    pub id: Uuid,
    pub label: String,
    pub color: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FeedProject {
    pub id: Uuid,
    pub name: String,
    pub color: String,
    pub image_url: Option<String>,
}

impl From<Tag> for FeedSessionTag {
    fn from(tag: Tag) -> Self {
        Self {
            id: tag.id,
            label: tag.label,
            color: tag.color,
        }
    }
}
impl From<Category> for FeedSessionCategory {
    fn from(category: Category) -> Self {
        Self {
            id: category.id,
            name: category.name,
            color: category.color,
        }
    }
}
