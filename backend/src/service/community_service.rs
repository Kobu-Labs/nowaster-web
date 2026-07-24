use anyhow::Result;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::{
        community::{
            create_community::CreateCommunityDto,
            discover::{
                CommunitySearchResultDto, DiscoverCommunitiesDto, DiscoverCommunitiesResultDto,
            },
            join_community::JoinCommunityDto,
            read_community::ReadCommunityDto,
            read_member::{
                CommunityCapabilitiesDto, ReadCommunityMemberDto, ReadCommunityMembersPageDto,
                RemoveMemberDto, UpdateMemberRoleDto,
            },
            update_community::UpdateCommunityDto,
        },
        user::read_user::ReadUserDto,
    },
    entity::community::{
        Community, CommunityDataVisibility, CommunityMemberRole, CommunityVisibilityType,
    },
    repository::{
        community::{CommunityMemberWithUserRow, CommunityRepository},
        community_discovery::{CommunityDiscoveryRepository, DiscoverCommunitiesFilter},
    },
    router::clerk::Actor,
};

const DEFAULT_MEMBERS_PAGE_SIZE: i64 = 50;
const MAX_MEMBERS_PAGE_SIZE: i64 = 100;
const DEFAULT_DISCOVER_PAGE_SIZE: i64 = 20;
const MAX_DISCOVER_PAGE_SIZE: i64 = 50;
const CATEGORY_AUTOCOMPLETE_LIMIT: i64 = 10;

fn member_row_to_dto(row: CommunityMemberWithUserRow) -> ReadCommunityMemberDto {
    ReadCommunityMemberDto {
        id: row.id,
        user: ReadUserDto {
            id: row.user_id,
            username: row.username,
            avatar_thumb_url: row.avatar_thumb_url,
            avatar_image_url: row.avatar_image_url,
            visibility_flags: row.visibility_flags,
        },
        role: row.role,
        joined_at: row.joined_at,
    }
}

#[derive(Clone)]
pub struct CommunityService {
    repo: CommunityRepository,
    discovery_repo: CommunityDiscoveryRepository,
}

impl CommunityService {
    pub fn new(repo: CommunityRepository, discovery_repo: CommunityDiscoveryRepository) -> Self {
        Self {
            repo,
            discovery_repo,
        }
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn create_community(
        &self,
        dto: CreateCommunityDto,
        actor: &Actor,
    ) -> Result<ReadCommunityDto> {
        let community = self
            .repo
            .create_with_owner_membership(dto, &actor.user_id)
            .await?;
        Ok(ReadCommunityDto::from_entity(community, actor, true))
    }

    #[instrument(err, skip(self), fields(community_id = %id, actor = %actor))]
    pub async fn get_community(&self, id: Uuid, actor: &Actor) -> Result<ReadCommunityDto> {
        let community = self.find_active_or_owned(id, actor).await?;
        let is_member = self
            .repo
            .find_membership(id, &actor.user_id)
            .await?
            .is_some();
        Ok(ReadCommunityDto::from_entity(community, actor, is_member))
    }

    #[instrument(err, skip(self), fields(community_id = %dto.id, actor = %actor))]
    pub async fn update_community(
        &self,
        dto: UpdateCommunityDto,
        actor: &Actor,
    ) -> Result<ReadCommunityDto> {
        let community = self
            .repo
            .find_by_id(dto.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.owner_id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to update this community"
            ));
        }

        let updated = self.repo.update(dto).await?;
        Ok(ReadCommunityDto::from_entity(updated, actor, true))
    }

    #[instrument(err, skip(self), fields(community_id = %id, actor = %actor))]
    pub async fn archive_community(&self, id: Uuid, actor: &Actor) -> Result<()> {
        let community = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.owner_id != actor.user_id {
            return Err(anyhow::anyhow!(
                "You are not allowed to archive this community"
            ));
        }

        if community.is_archived() {
            return Err(anyhow::anyhow!("This community is already archived"));
        }

        self.repo.archive(id).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn list_my_communities(&self, actor: &Actor) -> Result<Vec<ReadCommunityDto>> {
        let communities = self.repo.list_for_member(&actor.user_id).await?;
        Ok(communities
            .into_iter()
            .map(|c| ReadCommunityDto::from_entity(c, actor, true))
            .collect())
    }

    #[instrument(err, skip(self), fields(community_id = %dto.community_id, actor = %actor))]
    pub async fn join_community(
        &self,
        dto: JoinCommunityDto,
        actor: &Actor,
    ) -> Result<ReadCommunityMemberDto> {
        let community = self
            .repo
            .find_by_id(dto.community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.is_archived() {
            return Err(anyhow::anyhow!("This community is no longer active"));
        }

        if self
            .repo
            .find_membership(dto.community_id, &actor.user_id)
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!(
                "You are already a member of this community"
            ));
        }

        if community.visibility_type == CommunityVisibilityType::InviteOnly {
            return Err(anyhow::anyhow!(
                "This community requires an invite to join. Use an invite link or accept a direct invite."
            ));
        }

        self.repo
            .add_member(community.id, &actor.user_id, CommunityMemberRole::Member)
            .await?;

        let row = self
            .repo
            .find_member_with_user(community.id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to load new membership"))?;

        Ok(member_row_to_dto(row))
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn leave_community(&self, community_id: Uuid, actor: &Actor) -> Result<()> {
        let membership = self
            .repo
            .find_membership(community_id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("You are not a member of this community"))?;

        if membership.role == CommunityMemberRole::Owner {
            return Err(anyhow::anyhow!(
                "The owner cannot leave a community. Archive it or transfer ownership first."
            ));
        }

        self.repo
            .remove_member(community_id, &actor.user_id)
            .await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn list_members(
        &self,
        community_id: Uuid,
        actor: &Actor,
        limit: Option<i64>,
        offset: Option<i64>,
    ) -> Result<ReadCommunityMembersPageDto> {
        let community = self.find_active_or_owned(community_id, actor).await?;
        self.assert_can_view_community_data(&community, actor)
            .await?;

        let limit = limit
            .unwrap_or(DEFAULT_MEMBERS_PAGE_SIZE)
            .clamp(1, MAX_MEMBERS_PAGE_SIZE);
        let offset = offset.unwrap_or(0).max(0);

        let rows = self.repo.list_members(community_id, limit, offset).await?;
        let total = self.repo.count_members(community_id).await?;

        Ok(ReadCommunityMembersPageDto {
            members: rows.into_iter().map(member_row_to_dto).collect(),
            total,
        })
    }

    #[instrument(err, skip(self), fields(community_id = %dto.community_id, target_user = %dto.user_id, actor = %actor))]
    pub async fn update_member_role(
        &self,
        dto: UpdateMemberRoleDto,
        actor: &Actor,
    ) -> Result<ReadCommunityMemberDto> {
        let acting_member = self
            .repo
            .find_membership(dto.community_id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("You are not a member of this community"))?;

        if !acting_member.role.can_change_roles() {
            return Err(anyhow::anyhow!(
                "You must be the community owner to change member roles"
            ));
        }

        if dto.user_id == actor.user_id {
            return Err(anyhow::anyhow!("You cannot change your own role"));
        }

        let target = self
            .repo
            .find_membership(dto.community_id, &dto.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("That user is not a member of this community"))?;

        if target.role == CommunityMemberRole::Owner {
            return Err(anyhow::anyhow!("You cannot change the owner's role"));
        }

        if dto.new_role == CommunityMemberRole::Owner {
            return Err(anyhow::anyhow!(
                "Ownership can only change through community deletion or transfer"
            ));
        }

        if target.role == dto.new_role {
            return Err(anyhow::anyhow!("This member already has that role"));
        }

        self.repo
            .update_member_role(dto.community_id, &dto.user_id, dto.new_role)
            .await?;

        let row = self
            .repo
            .find_member_with_user(dto.community_id, &dto.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to load updated membership"))?;

        Ok(member_row_to_dto(row))
    }

    #[instrument(err, skip(self), fields(community_id = %dto.community_id, target_user = %dto.user_id, actor = %actor))]
    pub async fn remove_member(&self, dto: RemoveMemberDto, actor: &Actor) -> Result<()> {
        let acting_member = self
            .repo
            .find_membership(dto.community_id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("You are not a member of this community"))?;

        if !acting_member.role.can_manage_members() {
            return Err(anyhow::anyhow!(
                "You do not have permission to remove members from this community"
            ));
        }

        let target = self
            .repo
            .find_membership(dto.community_id, &dto.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("That user is not a member of this community"))?;

        if target.role == CommunityMemberRole::Owner {
            return Err(anyhow::anyhow!("The community owner cannot be removed"));
        }

        if target.role == CommunityMemberRole::Manager
            && acting_member.role != CommunityMemberRole::Owner
        {
            return Err(anyhow::anyhow!("Only the owner can remove a manager"));
        }

        self.repo
            .remove_member(dto.community_id, &dto.user_id)
            .await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn get_capabilities(
        &self,
        community_id: Uuid,
        actor: &Actor,
    ) -> Result<CommunityCapabilitiesDto> {
        let community = self.find_active_or_owned(community_id, actor).await?;
        let role = self
            .repo
            .find_membership(community_id, &actor.user_id)
            .await?
            .map(|m| m.role);

        let (can_manage_members, can_manage_categories, can_change_roles) = match role {
            Some(role) => (
                role.can_manage_members(),
                role.can_manage_categories(),
                role.can_change_roles(),
            ),
            None => (false, false, false),
        };

        Ok(CommunityCapabilitiesDto {
            can_manage_members,
            can_manage_categories,
            can_change_roles,
            can_delete_community: community.owner_id == actor.user_id,
        })
    }

    async fn find_active_or_owned(&self, id: Uuid, actor: &Actor) -> Result<Community> {
        let community = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.is_archived() && community.owner_id != actor.user_id {
            return Err(anyhow::anyhow!("Community not found"));
        }

        Ok(community)
    }

    async fn assert_can_view_community_data(
        &self,
        community: &Community,
        actor: &Actor,
    ) -> Result<()> {
        if community.data_visibility == CommunityDataVisibility::Public {
            return Ok(());
        }

        let is_member = self
            .repo
            .find_membership(community.id, &actor.user_id)
            .await?
            .is_some();

        if !is_member {
            return Err(anyhow::anyhow!(
                "You must be a member to view this community's members"
            ));
        }

        Ok(())
    }

    #[instrument(err, skip(self), fields(actor = %actor, query = ?dto.query, sort = ?dto.sort))]
    pub async fn discover_communities(
        &self,
        dto: DiscoverCommunitiesDto,
        actor: &Actor,
    ) -> Result<DiscoverCommunitiesResultDto> {
        let limit = dto
            .limit
            .unwrap_or(DEFAULT_DISCOVER_PAGE_SIZE)
            .clamp(1, MAX_DISCOVER_PAGE_SIZE);
        let offset = dto.offset.unwrap_or(0).max(0);

        let rows = self
            .discovery_repo
            .search_public_communities(
                DiscoverCommunitiesFilter {
                    query: dto.query,
                    category: dto.category,
                    sort: dto.sort,
                    limit,
                    offset,
                },
                &actor.user_id,
            )
            .await?;

        let total_count = rows.first().map(|row| row.total_count).unwrap_or(0);

        let results = rows
            .into_iter()
            .map(|row| CommunitySearchResultDto {
                id: row.id,
                name: row.name,
                description: row.description,
                avatar_url: row.avatar_url,
                member_count: row.member_count,
                recent_activity_minutes: row.recent_minutes as i64,
                is_member: row.is_member,
                created_at: row.created_at,
            })
            .collect();

        Ok(DiscoverCommunitiesResultDto {
            results,
            total_count,
        })
    }

    #[instrument(err, skip(self), fields(prefix = %prefix))]
    pub async fn autocomplete_categories(&self, prefix: &str) -> Result<Vec<String>> {
        self.discovery_repo
            .list_distinct_tracked_category_names(prefix, CATEGORY_AUTOCOMPLETE_LIMIT)
            .await
    }
}
