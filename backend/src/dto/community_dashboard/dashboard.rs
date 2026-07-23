use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::dto::user::read_user::ReadUserDto;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityDashboardDto {
    pub community_id: Uuid,
    pub total_minutes: f64,
    pub total_sessions: i64,
    pub member_count: i64,
    pub categories: Vec<CategoryBreakdownDto>,
    pub members: Vec<MemberContributionDto>,
    pub generated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CategoryBreakdownDto {
    pub tracked_category_id: Uuid,
    pub name: String,
    pub color: String,
    pub total_minutes: f64,
    pub session_count: i64,
    pub percentage: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MemberContributionDto {
    pub user: ReadUserDto,
    pub total_minutes: f64,
    pub session_count: i64,
    pub percentage: f64,
}
