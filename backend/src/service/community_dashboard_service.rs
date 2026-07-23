use anyhow::Result;
use chrono::Local;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::{
        community_dashboard::dashboard::{
            CategoryBreakdownDto, CommunityDashboardDto, MemberContributionDto,
        },
        user::read_user::ReadUserDto,
    },
    entity::community::CommunityDataVisibility,
    repository::{
        community::CommunityRepository, community_dashboard::CommunityDashboardRepository,
    },
    router::clerk::Actor,
};

fn percentage_of(part: f64, total: f64) -> f64 {
    if total <= 0.0 {
        0.0
    } else {
        (part / total) * 100.0
    }
}

#[derive(Clone)]
pub struct CommunityDashboardService {
    repo: CommunityDashboardRepository,
    community_repo: CommunityRepository,
}

impl CommunityDashboardService {
    pub fn new(repo: CommunityDashboardRepository, community_repo: CommunityRepository) -> Self {
        Self {
            repo,
            community_repo,
        }
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn get_dashboard(
        &self,
        community_id: Uuid,
        actor: &Actor,
    ) -> Result<CommunityDashboardDto> {
        let community = self
            .community_repo
            .find_by_id(community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.is_archived() {
            return Err(anyhow::anyhow!("Community not found"));
        }

        if community.data_visibility == CommunityDataVisibility::MembersOnly {
            let is_member = self
                .community_repo
                .find_membership(community_id, &actor.user_id)
                .await?
                .is_some();

            if !is_member {
                return Err(anyhow::anyhow!(
                    "You must be a member to view this community's dashboard"
                ));
            }
        }

        let (total, categories, members) = tokio::join!(
            self.repo.get_total_minutes(community_id),
            self.repo.get_category_breakdown(community_id),
            self.repo.get_member_contributions(community_id)
        );

        let (total_minutes, total_sessions) = total?;
        let categories = categories?;
        let members = members?;

        let member_count = members.len() as i64;

        let categories = categories
            .into_iter()
            .map(|row| CategoryBreakdownDto {
                percentage: percentage_of(row.total_minutes, total_minutes),
                tracked_category_id: row.tracked_category_id,
                name: row.name,
                color: row.color,
                total_minutes: row.total_minutes,
                session_count: row.session_count,
            })
            .collect();

        let members = members
            .into_iter()
            .map(|row| MemberContributionDto {
                percentage: percentage_of(row.total_minutes, total_minutes),
                total_minutes: row.total_minutes,
                session_count: row.session_count,
                user: ReadUserDto {
                    id: row.user_id,
                    username: row.username,
                    avatar_url: row.avatar_url,
                    visibility_flags: row.visibility_flags,
                },
            })
            .collect();

        Ok(CommunityDashboardDto {
            community_id,
            total_minutes,
            total_sessions,
            member_count,
            categories,
            members,
            generated_at: Local::now(),
        })
    }
}
