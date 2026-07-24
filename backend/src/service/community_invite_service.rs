use anyhow::Result;
use chrono::{Duration, Local};
use rand::Rng;
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community::invite::{
        CommunityInvitePreviewDto, CreateDirectInviteDto, CreateLinkInviteDto, JoinViaCodeDto,
        ReadCommunityInviteDto, RespondToInviteDto, RevokeInviteDto,
    },
    entity::community::{
        CommunityInvite, CommunityInviteStatus, CommunityInviteType, CommunityMemberRole,
    },
    repository::{community::CommunityRepository, community_invite::CommunityInviteRepository},
    router::clerk::Actor,
    service::{notification_service::NotificationService, user_service::UserService},
};

const INVITE_CODE_LENGTH: usize = 10;
const INVITE_CODE_ALPHABET: &[u8] = b"ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const MAX_INVITE_CODE_ATTEMPTS: u8 = 5;

fn generate_invite_code() -> String {
    let mut rng = rand::thread_rng();
    (0..INVITE_CODE_LENGTH)
        .map(|_| {
            let idx = rng.gen_range(0..INVITE_CODE_ALPHABET.len());
            INVITE_CODE_ALPHABET[idx] as char
        })
        .collect()
}

#[derive(Clone)]
pub struct CommunityInviteService {
    repo: CommunityInviteRepository,
    community_repo: CommunityRepository,
    user_service: UserService,
    notification_service: NotificationService,
}

impl CommunityInviteService {
    pub fn new(
        repo: CommunityInviteRepository,
        community_repo: CommunityRepository,
        user_service: UserService,
        notification_service: NotificationService,
    ) -> Self {
        Self {
            repo,
            community_repo,
            user_service,
            notification_service,
        }
    }

    #[instrument(err, skip(self), fields(community_id = %dto.community_id, actor = %actor))]
    pub async fn create_direct_invite(
        &self,
        dto: CreateDirectInviteDto,
        actor: &Actor,
    ) -> Result<ReadCommunityInviteDto> {
        let community = self
            .community_repo
            .find_by_id(dto.community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        let acting_member = self
            .community_repo
            .find_membership(dto.community_id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("You are not a member of this community"))?;

        if !acting_member.role.can_manage_members() {
            return Err(anyhow::anyhow!(
                "You do not have permission to invite members to this community"
            ));
        }

        let invitee = self
            .user_service
            .get_user_by_name(dto.invitee_username.clone())
            .await?
            .ok_or_else(|| anyhow::anyhow!("User not found"))?;

        if self
            .community_repo
            .find_membership(dto.community_id, &invitee.id)
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!(
                "{} is already a member of this community",
                invitee.username
            ));
        }

        let invite = self
            .repo
            .create_direct_invite(dto.community_id, &invitee.id, &actor.user_id)
            .await?;

        let inviter = self
            .user_service
            .get_user_by_id(&actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Inviter not found"))?;

        self.notification_service
            .notify_community_invite_received(
                invite.id,
                community.id,
                community.name.clone(),
                invitee.clone(),
                inviter.clone(),
            )
            .await?;

        Ok(self.to_read_dto(invite, community.name, Some(invitee), inviter))
    }

    #[instrument(err, skip(self), fields(community_id = %dto.community_id, actor = %actor))]
    pub async fn create_link_invite(
        &self,
        dto: CreateLinkInviteDto,
        actor: &Actor,
    ) -> Result<ReadCommunityInviteDto> {
        let community = self
            .community_repo
            .find_by_id(dto.community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        let acting_member = self
            .community_repo
            .find_membership(dto.community_id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("You are not a member of this community"))?;

        if !acting_member.role.can_manage_members() {
            return Err(anyhow::anyhow!(
                "You do not have permission to invite members to this community"
            ));
        }

        let expires_at = dto
            .expires_in_days
            .map(|days| Local::now() + Duration::days(days));

        let mut code = generate_invite_code();
        for _ in 0..MAX_INVITE_CODE_ATTEMPTS {
            if self.repo.get_invite_by_code(&code).await?.is_none() {
                break;
            }
            code = generate_invite_code();
        }

        let invite = self
            .repo
            .create_link_invite(
                dto.community_id,
                &code,
                &actor.user_id,
                expires_at,
                dto.max_uses,
            )
            .await?;

        let creator = self
            .user_service
            .get_user_by_id(&actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Creator not found"))?;

        Ok(self.to_read_dto(invite, community.name, None, creator))
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor = %actor))]
    pub async fn list_community_invites(
        &self,
        community_id: Uuid,
        actor: &Actor,
    ) -> Result<Vec<ReadCommunityInviteDto>> {
        let community = self
            .community_repo
            .find_by_id(community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        let acting_member = self
            .community_repo
            .find_membership(community_id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("You are not a member of this community"))?;

        if !acting_member.role.can_manage_members() {
            return Err(anyhow::anyhow!(
                "You do not have permission to view this community's invites"
            ));
        }

        let invites = self.repo.list_community_invites(community_id).await?;
        self.to_read_dtos(invites, &community.name).await
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn list_incoming_invites(
        &self,
        actor: &Actor,
    ) -> Result<Vec<ReadCommunityInviteDto>> {
        let invites = self.repo.list_incoming_invites(&actor.user_id).await?;

        let mut result = Vec::with_capacity(invites.len());
        for invite in invites {
            let community = self
                .community_repo
                .find_by_id(invite.community_id)
                .await?
                .ok_or_else(|| anyhow::anyhow!("Community not found"))?;
            let invited_user = self.user_service.get_user_by_id(&actor.user_id).await?;
            let created_by = self.user_service.get_user_by_id(&invite.created_by).await?;

            if let (Some(invited_user), Some(created_by)) = (invited_user, created_by) {
                result.push(self.to_read_dto(
                    invite,
                    community.name,
                    Some(invited_user),
                    created_by,
                ));
            }
        }

        Ok(result)
    }

    #[instrument(err, skip(self), fields(invite_id = %dto.invite_id, actor = %actor))]
    pub async fn respond_to_invite(
        &self,
        dto: RespondToInviteDto,
        actor: &Actor,
    ) -> Result<ReadCommunityInviteDto> {
        let invite = self
            .repo
            .get_invite(dto.invite_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Invite not found"))?;

        if invite.invited_user_id.as_deref() != Some(actor.user_id.as_str()) {
            return Err(anyhow::anyhow!("This invite is not addressed to you"));
        }

        if invite.status != CommunityInviteStatus::Pending {
            return Err(anyhow::anyhow!("This invite has already been responded to"));
        }

        if invite.is_expired() {
            return Err(anyhow::anyhow!("This invite has expired"));
        }

        let community = self
            .community_repo
            .find_by_id(invite.community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        let new_status = if dto.accept {
            CommunityInviteStatus::Accepted
        } else {
            CommunityInviteStatus::Declined
        };

        let updated = self
            .repo
            .update_invite_status(invite.id, new_status)
            .await?;

        if dto.accept {
            if self
                .community_repo
                .find_membership(invite.community_id, &actor.user_id)
                .await?
                .is_none()
            {
                self.community_repo
                    .add_member(
                        invite.community_id,
                        &actor.user_id,
                        CommunityMemberRole::Member,
                    )
                    .await?;
            }

            let accepter = self
                .user_service
                .get_user_by_id(&actor.user_id)
                .await?
                .ok_or_else(|| anyhow::anyhow!("User not found"))?;

            self.notification_service
                .notify_community_invite_accepted(
                    &invite.created_by,
                    community.id,
                    community.name.clone(),
                    accepter,
                )
                .await?;
        }

        let invited_user = self.user_service.get_user_by_id(&actor.user_id).await?;
        let created_by = self
            .user_service
            .get_user_by_id(&updated.created_by)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Inviter not found"))?;

        Ok(self.to_read_dto(updated, community.name, invited_user, created_by))
    }

    #[instrument(err, skip(self), fields(community_id = %dto.community_id, invite_id = %dto.invite_id, actor = %actor))]
    pub async fn revoke_invite(&self, dto: RevokeInviteDto, actor: &Actor) -> Result<()> {
        let invite = self
            .repo
            .get_invite(dto.invite_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Invite not found"))?;

        if invite.community_id != dto.community_id {
            return Err(anyhow::anyhow!("Invite not found"));
        }

        let acting_member = self
            .community_repo
            .find_membership(dto.community_id, &actor.user_id)
            .await?;

        let can_manage = acting_member
            .as_ref()
            .is_some_and(|m| m.role.can_manage_members());
        let is_original_inviter = invite.created_by == actor.user_id;

        if !can_manage && !is_original_inviter {
            return Err(anyhow::anyhow!(
                "You do not have permission to revoke this invite"
            ));
        }

        self.repo
            .update_invite_status(invite.id, CommunityInviteStatus::Revoked)
            .await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(actor = %actor))]
    pub async fn join_via_code(&self, dto: JoinViaCodeDto, actor: &Actor) -> Result<()> {
        let invite = self
            .repo
            .get_invite_by_code(&dto.code)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Invalid or expired invite code"))?;

        if invite.invite_type != CommunityInviteType::Link
            || invite.status != CommunityInviteStatus::Pending
        {
            return Err(anyhow::anyhow!("Invalid or expired invite code"));
        }

        if invite.is_expired() {
            return Err(anyhow::anyhow!("This invite link is no longer valid"));
        }

        if let Some(max_uses) = invite.max_uses {
            if invite.use_count >= max_uses {
                return Err(anyhow::anyhow!(
                    "This invite link has reached its maximum number of uses"
                ));
            }
        }

        let community = self
            .community_repo
            .find_by_id(invite.community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        if community.is_archived() {
            return Err(anyhow::anyhow!("This community is no longer active"));
        }

        if self
            .community_repo
            .find_membership(invite.community_id, &actor.user_id)
            .await?
            .is_some()
        {
            return Err(anyhow::anyhow!(
                "You are already a member of this community"
            ));
        }

        self.community_repo
            .add_member(
                invite.community_id,
                &actor.user_id,
                CommunityMemberRole::Member,
            )
            .await?;
        self.repo.increment_use_count(invite.id).await?;

        Ok(())
    }

    #[instrument(err, skip(self), fields(code = %code))]
    pub async fn preview_by_code(&self, code: &str) -> Result<CommunityInvitePreviewDto> {
        let invite = self
            .repo
            .get_invite_by_code(code)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Invalid or expired invite code"))?;

        if invite.invite_type != CommunityInviteType::Link
            || invite.status != CommunityInviteStatus::Pending
            || invite.is_expired()
        {
            return Err(anyhow::anyhow!("Invalid or expired invite code"));
        }

        let community = self
            .community_repo
            .find_by_id(invite.community_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Community not found"))?;

        let member_count = self.community_repo.count_members(community.id).await?;

        Ok(CommunityInvitePreviewDto {
            community_id: community.id,
            name: community.name,
            avatar_url: community.avatar_url,
            member_count,
            visibility_type: community.visibility_type,
        })
    }

    async fn to_read_dtos(
        &self,
        invites: Vec<CommunityInvite>,
        community_name: &str,
    ) -> Result<Vec<ReadCommunityInviteDto>> {
        let mut result = Vec::with_capacity(invites.len());
        for invite in invites {
            let invited_user = match &invite.invited_user_id {
                Some(user_id) => self.user_service.get_user_by_id(user_id).await?,
                None => None,
            };
            let created_by = self
                .user_service
                .get_user_by_id(&invite.created_by)
                .await?
                .ok_or_else(|| anyhow::anyhow!("Inviter not found"))?;

            result.push(self.to_read_dto(
                invite,
                community_name.to_string(),
                invited_user,
                created_by,
            ));
        }
        Ok(result)
    }

    fn to_read_dto(
        &self,
        invite: CommunityInvite,
        community_name: String,
        invited_user: Option<crate::dto::user::read_user::ReadUserDto>,
        created_by: crate::dto::user::read_user::ReadUserDto,
    ) -> ReadCommunityInviteDto {
        ReadCommunityInviteDto {
            id: invite.id,
            community_id: invite.community_id,
            community_name,
            invite_type: invite.invite_type,
            status: invite.status,
            invited_user,
            code: invite.code,
            created_by,
            expires_at: invite.expires_at,
            max_uses: invite.max_uses,
            use_count: invite.use_count,
            created_at: invite.created_at,
        }
    }
}
