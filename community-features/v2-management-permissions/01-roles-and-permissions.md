# Step 1: Roles and Permissions

## Overview

v1 shipped exactly two roles: `owner` (the creator, exactly one, cannot leave
without transferring ownership or deleting the community) and `member` (no
management rights at all). This step inserts a `manager` role between them
and, more importantly, introduces the first real permission model: a
manager can invite/remove members and manage tracked categories, but cannot
touch community settings, delete the community, or promote/demote anyone.
Everything downstream in v2 (invites, discovery, leaderboard, bulk ops)
assumes this role hierarchy exists, so it lands first. This step also
retrofits the permission check onto v1's tracked-category management
endpoints (`community_tracked_category` CRUD), which in v1 were owner-only.

## Scope

- In scope:
  - Add `manager` to the `community_member_role` enum, ordered `member < manager <
    owner`
  - Service-layer permission checks: promote member→manager, demote
    manager→member, remove a member, remove a manager (owner only)
  - Retrofit permission checks on v1's `community_tracked_category`
    create/update/delete endpoints to allow `role >= manager`
  - Member management UI: role badges, promote/demote/remove actions in the
    member list, with confirmation and optimistic updates
  - A `can_manage_members` / `can_manage_categories` capability surfaced to
    the frontend so the UI can hide actions the current user can't perform
- Explicitly deferred:
  - Ownership transfer (an owner handing the community to someone else
    while staying a member) — v1's constraint stands unchanged: an owner
    can only delete the community, not leave it. No transfer UI ships in
    v2. (→ v4, alongside other moderation tooling)
  - Per-permission granularity beyond the three fixed roles (e.g. a
    manager who can invite but not manage categories) — the three roles
    are fixed bundles, not a permission matrix (→ not planned; revisit if
    real usage demands it)
  - Audit log of role changes (→ v3, alongside the activity feed)

## Data Model

### Inherited from v1 (read-only reference, not re-created here)

```sql
CREATE TYPE community_member_role AS ENUM ('member', 'owner');

CREATE TABLE community_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    role community_member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(community_id, user_id)
);
```

### Migration: `backend/migrations/0061_add_manager_role_to_community_member.sql`

Assumption stated per plan convention: v1's four steps claim migrations
`0057`–`0060` (one schema migration per step: create/CRUD, membership +
invite code, tracked categories + mapping, aggregation). The latest
migration checked at plan time was `0056`
(`ls backend/migrations | sort -V | tail -1`), so v1 starts at `0057` and
this plan's first migration is `0061`. Re-run
`ls backend/migrations | sort -V | tail -1` before cutting the real file —
if v1 landed a different number of migrations, shift accordingly, just
never reuse a number.

```sql
-- 0061_add_manager_role_to_community_member.sql

-- Postgres requires the new enum value be committed before it can be used
-- in the same session's queries, but ADD VALUE itself is safe inside the
-- single-statement transaction sqlx wraps each migration file in — the
-- notification_type enum was extended the same way in 0041/0051/0052.
ALTER TYPE community_member_role ADD VALUE IF NOT EXISTS 'manager' AFTER 'member';
```

Note on ordering: `community_member_role` is declared as `('member', 'owner')` in
v1. `AFTER 'member'` yields the storage order `member, manager, owner`,
which is also the ascending permission order the Rust `PartialOrd` derive
relies on (see below) — keep the two in sync if this migration's target
value ever changes.

### Rust entity changes (`backend/src/entity/community.rs`)

```rust
use serde::{Deserialize, Serialize};

// v1 shape (for reference):
// #[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
// #[sqlx(type_name = "community_member_role", rename_all = "snake_case")]
// #[serde(rename_all = "snake_case")]
// pub enum CommunityMemberRole { Member, Owner }

// v2: insert Manager between Member and Owner. Declaration order backs the
// derived PartialOrd, so `role >= CommunityMemberRole::Manager` is a real
// permission check, not just a label comparison.
#[derive(Clone, Debug, PartialEq, PartialOrd, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_member_role", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityMemberRole {
    Member,
    Manager,
    Owner,
}

impl CommunityMemberRole {
    pub fn can_manage_members(&self) -> bool {
        *self >= CommunityMemberRole::Manager
    }

    pub fn can_manage_categories(&self) -> bool {
        *self >= CommunityMemberRole::Manager
    }

    pub fn can_change_roles(&self) -> bool {
        *self == CommunityMemberRole::Owner
    }

    pub fn can_delete_community(&self) -> bool {
        *self == CommunityMemberRole::Owner
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommunityMember {
    pub id: uuid::Uuid,
    pub community_id: uuid::Uuid,
    pub user_id: String,
    pub role: CommunityMemberRole,
    pub joined_at: chrono::DateTime<chrono::Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community/member.rs`)

This file exists from v1 (join/leave). v2 adds:

| Function | Purpose |
|---|---|
| `get_member(&self, community_id: Uuid, user_id: &str) -> Result<Option<CommunityMember>>` | Fetch a single membership row, used for every permission check |
| `update_member_role(&self, community_id: Uuid, user_id: &str, new_role: CommunityMemberRole) -> Result<CommunityMember>` | Persist a promote/demote |
| `remove_member(&self, community_id: Uuid, user_id: &str) -> Result<CommunityMember>` | Delete the membership row, returns the row that was deleted (for the notification/UI to reference) |
| `count_members_by_role(&self, community_id: Uuid, role: CommunityMemberRole) -> Result<i64>` | Used to guard against ever having zero owners |
| `list_members_with_user(&self, community_id: Uuid) -> Result<Vec<ReadCommunityMemberDto>>` | v1's member list query, now also selects `role` for badge rendering (already selected in v1, unchanged) |

### Service (`backend/src/service/community_service.rs`)

v1's `community_service` already owns join/leave and tracked-category CRUD.
v2 adds role-management methods and tightens the tracked-category
permission check that already existed there.

Permission rules, stated exactly:

- **Promote (member → manager) / demote (manager → member)**: actor must
  be `owner` of the community. Nobody can promote/demote themselves except
  the owner acting on someone else — an owner cannot demote themselves
  (there is no "member" or "manager" owner state; ownership only changes
  via the deferred transfer flow).
- **Remove a member** (`role == member`): actor must be `role >= manager`.
- **Remove a manager**: actor must be `owner`. A manager cannot remove
  another manager or the owner.
- **Remove the owner**: never allowed through this endpoint. Deleting the
  community or (future) transferring ownership are the only ways an owner
  stops being the owner.
- **Manage tracked categories** (create/update/delete
  `community_tracked_category`, retrofitted from v1's owner-only check):
  actor must be `role >= manager`.
- A user cannot remove or demote themselves via these endpoints — leaving
  uses v1's existing `leave_community` flow, which already forbids the
  owner from leaving.

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateMemberRoleDto {
    pub community_id: Uuid,
    pub user_id: String,
    pub new_role: CommunityMemberRole,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct RemoveMemberDto {
    pub community_id: Uuid,
    pub user_id: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityMemberDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub user: ReadUserDto,
    pub role: CommunityMemberRole,
    pub joined_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityCapabilitiesDto {
    pub can_manage_members: bool,
    pub can_manage_categories: bool,
    pub can_change_roles: bool,
    pub can_delete_community: bool,
    pub can_invite: bool,
}
```

Error cases (all `anyhow::anyhow!` strings, matching `friend_service.rs`
style, surfaced verbatim by `ApiResponse::Error`):

- `"You must be the community owner to change member roles"` — non-owner
  calls `update_member_role`.
- `"You cannot change your own role"` — actor targets themselves.
- `"This member is already a manager"` / `"This member is already a
  regular member"` — no-op promote/demote guarded before hitting the DB.
- `"You do not have permission to remove members from this community"` —
  a plain member calls `remove_member`.
- `"Only the owner can remove a manager"` — a manager targets another
  manager.
- `"The community owner cannot be removed"` — any actor targets the
  owner via `remove_member`.
- `"You do not have permission to manage this community's tracked
  categories"` — retrofitted check on the v1 tracked-category
  create/update/delete methods, now reading `role >= manager` instead of
  `role == owner`.

```rust
#[instrument(err, skip(self), fields(community_id = %dto.community_id, target_user = %dto.user_id, actor_id = %actor))]
pub async fn update_member_role(
    &self,
    dto: UpdateMemberRoleDto,
    actor: &Actor,
) -> Result<ReadCommunityMemberDto> {
    let acting_member = self
        .member_repo
        .get_member(dto.community_id, &actor.user_id)
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
        .member_repo
        .get_member(dto.community_id, &dto.user_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("That user is not a member of this community"))?;

    if target.role == CommunityMemberRole::Owner {
        return Err(anyhow::anyhow!("You cannot change the owner's role"));
    }

    if target.role == dto.new_role {
        return Err(anyhow::anyhow!("This member already has that role"));
    }

    if dto.new_role == CommunityMemberRole::Owner {
        return Err(anyhow::anyhow!(
            "Ownership can only change through community deletion or transfer"
        ));
    }

    let updated = self
        .member_repo
        .update_member_role(dto.community_id, &dto.user_id, dto.new_role.clone())
        .await?;

    let user = self.user_service.get_user_by_id(&updated.user_id).await?;

    Ok(ReadCommunityMemberDto {
        id: updated.id,
        community_id: updated.community_id,
        user,
        role: updated.role,
        joined_at: updated.joined_at,
    })
}
```

### Router (`backend/src/router/community/member.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/{community_id}/member` | `list_members_handler` | Actor, must be a member | List members with role, joined date (v1, unchanged shape, `role` already present) |
| PATCH | `/api/community/{community_id}/member/{user_id}/role` | `update_member_role_handler` | Actor, owner only (checked in service) | Promote/demote a member |
| DELETE | `/api/community/{community_id}/member/{user_id}` | `remove_member_handler` | Actor, manager+ (checked in service) | Remove a member/manager |
| GET | `/api/community/{community_id}/capabilities` | `get_capabilities_handler` | Actor, must be a member | Returns the actor's `CommunityCapabilitiesDto` for this community, used to drive UI affordances |

```rust
use axum::{
    extract::{Path, State},
    routing::{delete, get, patch},
    Router,
};
use uuid::Uuid;

use crate::{
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
    service::community_service::{RemoveMemberDto, UpdateMemberRoleDto},
};

pub fn community_member_router() -> Router<AppState> {
    Router::new()
        .route("/{community_id}/member", get(list_members_handler))
        .route(
            "/{community_id}/member/{user_id}/role",
            patch(update_member_role_handler),
        )
        .route(
            "/{community_id}/member/{user_id}",
            delete(remove_member_handler),
        )
        .route("/{community_id}/capabilities", get(get_capabilities_handler))
}

#[instrument(skip(state), fields(community_id = %community_id, target_user = %user_id, actor_id = %actor))]
async fn update_member_role_handler(
    State(state): State<AppState>,
    Path((community_id, user_id)): Path<(Uuid, String)>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpdateRoleBody>,
) -> ApiResponse<ReadCommunityMemberDto> {
    let result = state
        .community_service
        .update_member_role(
            UpdateMemberRoleDto {
                community_id,
                user_id,
                new_role: payload.role,
            },
            &actor,
        )
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(community_id = %community_id, target_user = %user_id, actor_id = %actor))]
async fn remove_member_handler(
    State(state): State<AppState>,
    Path((community_id, user_id)): Path<(Uuid, String)>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state
        .community_service
        .remove_member(RemoveMemberDto { community_id, user_id }, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

(`list_members_handler` and `get_capabilities_handler` follow the same
`State`/`Path`/`Actor` extractor shape and are omitted here for brevity —
both are simple `GET`s delegating straight to a service method.)

`community_member_router()` is merged into `community_router()` in
`backend/src/router/community/root.rs` alongside v1's create/edit/join
routes, exactly as `session/root.rs` merges `fixed.rs` and `stopwatch.rs`.

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/models/community.ts`, extended)

```ts
export const CommunityRoleSchema = z.enum(["member", "manager", "owner"]);
export type CommunityRole = z.infer<typeof CommunityRoleSchema>;

export const CommunityMemberSchema = z.object({
  id: z.uuid(),
  communityId: z.uuid(),
  user: UserSchema,
  role: CommunityRoleSchema,
  joinedAt: z.coerce.date<Date>(),
});
export type CommunityMember = z.infer<typeof CommunityMemberSchema>;

export const CommunityCapabilitiesSchema = z.object({
  canManageMembers: z.boolean(),
  canManageCategories: z.boolean(),
  canChangeRoles: z.boolean(),
  canDeleteCommunity: z.boolean(),
  canInvite: z.boolean(),
});
export type CommunityCapabilities = z.infer<typeof CommunityCapabilitiesSchema>;
```

`next-frontend/api/definitions/requests/community/member.ts`:

```ts
const updateRole = z.object({
  role: CommunityRoleSchema.exclude(["owner"]),
});

export const CommunityMemberRequestSchema = { updateRole };
export type CommunityMemberRequest = {
  [K in keyof typeof CommunityMemberRequestSchema]: z.infer<
    (typeof CommunityMemberRequestSchema)[K]
  >;
};
```

### API Client (`next-frontend/api/community.ts`, extended)

```ts
export const updateMemberRole = async (
  communityId: string,
  userId: string,
  params: CommunityMemberRequest["updateRole"],
) => {
  const { data } = await baseApi.patch(
    `/community/${communityId}/member/${userId}/role`,
    params,
  );
  return await parseResponseUnsafe(data, CommunityMemberResponseSchema.updateRole);
};

export const removeMember = async (communityId: string, userId: string) => {
  const { data } = await baseApi.delete(
    `/community/${communityId}/member/${userId}`,
  );
  return await parseResponseUnsafe(data, CommunityMemberResponseSchema.remove);
};

export const getCapabilities = async (communityId: string) => {
  const { data } = await baseApi.get(`/community/${communityId}/capabilities`);
  return await parseResponseUnsafe(data, CommunityCapabilitiesSchema);
};
```

### React Query Hooks

- `useCommunityMembers(communityId: string)` — `useQuery`, key
  `queryKeys.communities.members(communityId)`
- `useCommunityCapabilities(communityId: string)` — `useQuery`, key
  `queryKeys.communities.capabilities(communityId)`
- `useUpdateMemberRole(communityId: string)` — `useMutation`, optimistic
- `useRemoveMember(communityId: string)` — `useMutation`, optimistic

`queryKeys.communities.*` additions in
`next-frontend/components/hooks/queryHooks/queryKeys.ts`:

```ts
const communityKeys = createQueryKeys("communities", {
  members: (communityId: string) => ({
    queryFn: async () => await CommunityApi.getMembers(communityId),
    queryKey: [communityId, "members"],
  }),
  capabilities: (communityId: string) => ({
    queryFn: async () => await CommunityApi.getCapabilities(communityId),
    queryKey: [communityId, "capabilities"],
  }),
});
```

(Later steps append `invites`, `discover`, `leaderboard` entries to this
same `communityKeys` object — see their respective files.)

`useUpdateMemberRole` (optimistic promote/demote, matching the
`useCreateStopwatchSession` pattern):

```ts
export const useUpdateMemberRole = (communityId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: CommunityRole }) =>
      await CommunityApi.updateMemberRole(communityId, userId, { role }),
    onMutate: async ({ userId, role }) => {
      const key = queryKeys.communities.members(communityId).queryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommunityMember[]>(key);

      queryClient.setQueryData<CommunityMember[]>(key, (old) =>
        old?.map((m) => (m.user.id === userId ? { ...m, role } : m)),
      );

      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(
        queryKeys.communities.members(communityId).queryKey,
        context?.previous,
      );
      toast({
        description: error.message,
        title: "Couldn't update role",
        variant: "destructive",
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.communities.members(communityId)._def,
      });
    },
  });
};
```

### UI Components

- `components/visualizers/communities/MemberList.tsx` — renders the member
  table/cards, delegates role display to `MemberRoleBadge`
- `components/visualizers/communities/MemberRoleBadge.tsx` — small badge
  (icon + label, not color-only) for `owner` / `manager` / `member`
- `components/visualizers/communities/MemberActionsMenu.tsx` —
  dropdown (`shadcn/dropdown-menu`, matching `FriendsList`'s
  `MoreHorizontal` pattern) with "Promote to Manager" / "Demote to
  Member" / "Remove from community", each item's visibility gated by
  `useCommunityCapabilities`
- `components/visualizers/communities/ConfirmRemoveMemberDialog.tsx` —
  `AlertDialog`, same shape as `FriendsList`'s remove-friend confirmation
- `components/hooks/communities/useCommunityMembers.ts`,
  `useCommunityCapabilities.ts`, `useUpdateMemberRole.ts`,
  `useRemoveMember.ts`

Primary flow — owner promotes a member to manager:

1. Owner opens the community's **Members** tab; `MemberList` renders from
   `useCommunityMembers`, each row showing avatar, username,
   `MemberRoleBadge`.
2. Owner clicks the overflow menu (`MoreHorizontal`) on a `member` row.
   `MemberActionsMenu` reads `useCommunityCapabilities(communityId)`; since
   the actor is `owner`, `canChangeRoles` is `true`, so "Promote to
   Manager" is enabled (and "Remove" too, but "Demote to Member" is hidden
   because the row is already a member).
3. Owner clicks "Promote to Manager". No confirmation dialog for
   promotion (low-risk, reversible) — `useUpdateMemberRole` fires
   immediately.
4. `onMutate` optimistically swaps the row's badge to "Manager" before the
   network call resolves.
5. On success, the row stays as-is (already correct) and a toast confirms:
   "{username} is now a manager."
6. On failure (e.g. the owner's own session expired, or a race where the
   target left the community), the badge rolls back to "Member" and a
   toast reads: "Couldn't update role — {error}."

Removing a manager (owner-only, higher risk) instead opens
`ConfirmRemoveMemberDialog` before firing `useRemoveMember`, mirroring
`FriendsList`'s remove-friend confirmation exactly.

## UX & Polish

- **Loading state**: `MemberList` renders 4 skeleton rows
  (`Skeleton` at member-row height) while `useCommunityMembers` is
  pending — not a bare spinner.
- **Empty state**: unreachable in practice (a community always has at
  least the owner), but if `members.length === 1` (owner only), show a
  soft nudge above the list: "It's just you so far — invite people to
  build your community." with a button linking to the invite flow (step
  2).
- **Error states** (toast copy):
  - Promote/demote failure: `"Couldn't update role — {server message}"`
  - Remove failure: `"Couldn't remove {username} — {server message}"`
  - Capabilities fetch failure: management actions silently degrade to
    hidden (fail closed — no actions shown) rather than showing an error
    toast, since this is a background permission check, not a
    user-initiated action.
- **Optimistic update**: role badge changes instantly on
  promote/demote; removed members disappear from the list instantly on
  remove, both roll back on error (see hook above).
- **Responsive**: member list is cards on mobile (`<640px`), a table on
  `sm:` and up — reuses the `FriendsList` `grid md:grid-cols-2` pattern
  rather than a squeezed table.
- **Accessibility**:
  - `MemberRoleBadge` pairs an icon (crown for owner, shield for
    manager, no icon for member) with text — never color alone.
  - `MemberActionsMenu` trigger has `aria-label="Member actions for
    {username}"`.
  - Role change and remove are both reachable via keyboard (dropdown
    trigger is a real `<button>`, menu items are focusable, `Escape`
    closes).
  - `ConfirmRemoveMemberDialog`'s default focus lands on "Cancel", not
    the destructive action.

## Acceptance Criteria

- [ ] `community_member_role` enum has three values in order `member < manager <
      owner`; existing `owner`/`member` rows are unaffected by the
      migration.
- [ ] Only the owner can call `update_member_role`; a manager attempting
      it receives `"You must be the community owner to change member
      roles"`.
- [ ] A manager can remove a plain member but receives `"Only the owner
      can remove a manager"` when targeting another manager.
- [ ] Attempting to remove or demote the owner always fails, regardless
      of actor role.
- [ ] `community_tracked_category` create/update/delete succeed for
      `manager` and `owner`, fail for `member` with `"You do not have
      permission to manage this community's tracked categories"`.
- [ ] `GET /api/community/{id}/capabilities` returns correct booleans for
      each of the three roles.
- [ ] Promote/demote/remove in the UI reflect optimistically within one
      frame and roll back cleanly on a simulated 500.
- [ ] Role badges are distinguishable without color (icon + text) and
      pass keyboard-only interaction for promote/demote/remove.

## Testing Notes

- **Backend** (`backend/src/service/community_service.rs` or a
  `tests/community_member_roles.rs` integration test):
  - `test_owner_can_promote_member_to_manager`
  - `test_manager_cannot_promote_member`
  - `test_owner_cannot_change_own_role`
  - `test_manager_cannot_remove_manager`
  - `test_owner_can_remove_manager`
  - `test_cannot_remove_or_demote_owner`
  - `test_member_cannot_create_tracked_category`
  - `test_manager_can_create_tracked_category`
  - `test_capabilities_dto_matches_role_for_all_three_roles`
- **Frontend** (Storybook):
  - `MemberRoleBadge.stories.tsx` — one story per role, plus a
    `forced-colors`/grayscale story to verify non-color distinction
  - `MemberActionsMenu.stories.tsx` — stories for `viewer=owner`,
    `viewer=manager`, `viewer=member` showing the resulting enabled/hidden
    menu items
  - `MemberList.stories.tsx` — loading, populated (mixed roles), and
    single-member (owner-only) empty-nudge states
