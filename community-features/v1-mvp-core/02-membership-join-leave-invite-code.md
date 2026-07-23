# Step 2: Membership, Join/Leave, Invite Code

## Overview

This step turns a community from an owner-only container into something
people can actually belong to: a `community_member` table, join/leave
endpoints, a single static (non-expiring) invite code per community for
invite-only communities, and the member list UI. It depends on the
`community` table and `CommunityService` from Step 1 — specifically, it
modifies `CommunityService::create_community` to also create the owner's
membership row, and it widens `list_my_communities` from "owned by me" to
"I'm a member of."

## Scope

- In scope:
  - `community_member` table (`owner` / `member` roles only)
  - `community_invite_code` table (one static code per community, no expiry)
  - Join a public community directly (no code needed)
  - Join an invite-only community via its invite code
  - Leave a community (owner cannot leave without deleting/archiving first)
  - Owner can view/regenerate the invite code
  - Member list UI, with join/leave actions
  - Widening Step 1's create/list-mine to be membership-aware
- Explicitly deferred:
  - `manager` role, granular permissions (→ v2)
  - Per-user/expiring invites, invite accept/decline inbox (→ v2, this
    step's invite code is the *only* invite mechanism in v1)
  - Ownership transfer (→ v2) — in v1 an owner who wants to stop owning a
    community must archive it; they cannot demote themselves
  - Kicking/removing other members (→ v2, no moderation tooling in v1)
  - Public community discovery/search (→ v2) — v1's "join a public community
    directly" still requires the user to already have the community's id/link
    (e.g. shared out-of-band); there's no browse page yet

## Data Model

- Migration filename: `backend/migrations/0058_create_community_membership.sql`

```sql
-- backend/migrations/0058_create_community_membership.sql

-- Declared in ascending permission order (member < owner) so that both
-- `ORDER BY role DESC` (used below to put the owner first in member lists)
-- and any future `role >= X` comparison behave correctly. v2 inserts
-- 'manager' between them with `ALTER TYPE ... ADD VALUE 'manager' AFTER
-- 'member'`, relying on this ordering — keep it if this line ever changes.
CREATE TYPE community_member_role AS ENUM ('member', 'owner');

CREATE TABLE IF NOT EXISTS "community_member" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    role community_member_role NOT NULL DEFAULT 'member',

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_member_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT fk_community_member_user
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT uq_community_member UNIQUE (community_id, user_id)
);

CREATE INDEX idx_community_member_community_id ON "community_member"(community_id);
CREATE INDEX idx_community_member_user_id ON "community_member"(user_id);

CREATE TABLE IF NOT EXISTS "community_invite_code" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL UNIQUE,
    code VARCHAR(12) NOT NULL UNIQUE,
    created_by TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_invite_code_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT fk_community_invite_code_created_by
        FOREIGN KEY (created_by) REFERENCES "user"(id)
);

CREATE INDEX idx_community_invite_code_code ON "community_invite_code"(code);

-- Backfill: every existing community (created in Step 1, before this
-- migration existed) gets an owner membership row so the widened
-- "list communities I'm a member of" query in this step doesn't silently
-- drop communities created before this migration ran.
INSERT INTO "community_member" (community_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM "community"
ON CONFLICT (community_id, user_id) DO NOTHING;
```

`code` is a 10-character base32-ish human-friendly token (generated in the
service layer, not the DB, so it can be checked for collisions against
existing codes before insert — see Service section). `VARCHAR(12)` leaves
headroom.

Rust entities — additions to `backend/src/entity/community.rs`:

```rust
#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq)]
#[sqlx(type_name = "community_member_role", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityMemberRole {
    Member,
    Owner,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityMember {
    pub id: Uuid,
    pub community_id: Uuid,
    pub user_id: String,
    pub role: CommunityMemberRole,
    pub joined_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInviteCode {
    pub id: Uuid,
    pub community_id: Uuid,
    pub code: String,
    pub created_by: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community.rs` — extended)

- `pub async fn create_with_owner_membership(&self, dto: CreateCommunityDto, owner_id: &str) -> Result<Community>` —
  **replaces** Step 1's plain `create`: opens a transaction, inserts the
  `community` row, inserts a `community_member` row with `role = 'owner'`,
  commits, returns the community. (Step 1's `create` is renamed/removed; this
  is the only creation path from this step forward.)
- `pub async fn list_for_member(&self, user_id: &str) -> Result<Vec<Community>>` —
  joins `community_member` → `community` where `user_id = $1 AND archived_at IS NULL`,
  ordered by `joined_at DESC`. Replaces Step 1's `list_owned_by` as the query
  backing "list my communities" (kept as a separate method rather than
  deleting `list_owned_by`, since nothing else needs it, but the service call
  site switches to this one).
- `pub async fn find_membership(&self, community_id: Uuid, user_id: &str) -> Result<Option<CommunityMember>>` —
  single row lookup, used for permission checks everywhere ("is this actor a
  member / the owner").
- `pub async fn add_member(&self, community_id: Uuid, user_id: &str, role: CommunityMemberRole) -> Result<CommunityMember>` —
  plain insert; caller (service) has already validated eligibility.
- `pub async fn remove_member(&self, community_id: Uuid, user_id: &str) -> Result<()>` —
  `DELETE FROM community_member WHERE community_id = $1 AND user_id = $2`.
- `pub async fn list_members(&self, community_id: Uuid) -> Result<Vec<CommunityMemberWithUserDto>>` —
  joins `community_member` to `"user"` for `displayname`/`avatar_url`,
  ordered by `role DESC, joined_at ASC` (owner first, then earliest joiners).
- `pub async fn count_members(&self, community_id: Uuid) -> Result<i64>` —
  used by the join flow to show "1,204 members" without loading the full list.
- `pub async fn get_invite_code(&self, community_id: Uuid) -> Result<Option<CommunityInviteCode>>`
- `pub async fn upsert_invite_code(&self, community_id: Uuid, code: &str, created_by: &str) -> Result<CommunityInviteCode>` —
  `INSERT ... ON CONFLICT (community_id) DO UPDATE SET code = $2, updated_at = NOW()`;
  this is how "regenerate" works — same row, new code.
- `pub async fn find_community_by_invite_code(&self, code: &str) -> Result<Option<Community>>` —
  joins `community_invite_code` → `community`, used to resolve a code to a
  community both for the preview screen and for the join call.

### Service (`backend/src/service/community_service.rs` — extended)

New rules on top of Step 1's:

- **Create** (modified): after inserting, the actor is a `community_member`
  with `role = owner` — `list_my_communities` now finds it via
  `list_for_member`, not `list_owned_by`.
- **Join**:
  - If the actor is already a member → `Err(anyhow!("You are already a member of this community"))`.
  - If the community is archived → `Err(anyhow!("This community is no longer active"))`.
  - If `visibility_type == Public` → join directly, no code needed, even if
    an `invite_code` was supplied in the request (ignored).
  - If `visibility_type == InviteOnly` → the request's `invite_code` must
    resolve (case-insensitive compare) to *this* community's stored code, or
    `Err(anyhow!("Invalid or expired invite code"))`.
  - On success, `add_member(community_id, actor.user_id, Member)`.
- **Leave**:
  - Not a member → `Err(anyhow!("You are not a member of this community"))`.
  - Actor is the owner → `Err(anyhow!("The owner cannot leave a community. Archive it or transfer ownership first."))` (transfer doesn't exist yet in v1, so practically this means "archive it").
  - Otherwise → `remove_member`.
- **List members**: if `community.data_visibility == MembersOnly`, the actor
  must be a member (`find_membership` returns `Some`) or
  `Err(anyhow!("You must be a member to view this community's members"))`;
  if `Public`, any authenticated actor may view.
- **Get/regenerate invite code**: owner-only, same error phrasing as Step 1's
  update/archive checks (`"Only the owner can manage the invite code"`).
  Regeneration generates a fresh code via
  `generate_invite_code() -> String` (10 chars, `[A-Z0-9]`, excluding
  visually ambiguous characters `0/O`, `1/I/L`), retrying on the rare unique
  collision (loop up to 5 attempts, then `Err(anyhow!("Could not generate a unique invite code, try again"))`).
  If no code exists yet when the owner requests it (e.g. a community that
  predates this feature or was never lazily generated), `get_invite_code`
  generates one on first access rather than requiring a separate "create"
  call — one fewer round trip for the common case.
- **Preview by invite code**: resolves a code to a shallow community summary
  (id, name, avatar, member count) without requiring membership — this is
  what powers a `/communities/invite/[code]` landing page before the user
  decides to join. Does not leak invite-only communities' description or
  member list, only the minimum needed to decide "do I want to join this."

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct JoinCommunityDto {
    pub community_id: Uuid,
    pub invite_code: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityMemberDto {
    pub id: Uuid,
    pub user: ReadUserDto,
    pub role: CommunityMemberRole,
    pub joined_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadInviteCodeDto {
    pub code: String,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInvitePreviewDto {
    pub community_id: Uuid,
    pub name: String,
    pub avatar_url: Option<String>,
    pub member_count: i64,
    pub visibility_type: CommunityVisibilityType,
}
```

Method signatures added to `CommunityService`:

- `pub async fn join_community(&self, dto: JoinCommunityDto, actor: &Actor) -> Result<ReadCommunityMemberDto>`
- `pub async fn leave_community(&self, community_id: Uuid, actor: &Actor) -> Result<()>`
- `pub async fn list_members(&self, community_id: Uuid, actor: &Actor) -> Result<Vec<ReadCommunityMemberDto>>`
- `pub async fn get_invite_code(&self, community_id: Uuid, actor: &Actor) -> Result<ReadInviteCodeDto>`
- `pub async fn regenerate_invite_code(&self, community_id: Uuid, actor: &Actor) -> Result<ReadInviteCodeDto>`
- `pub async fn preview_by_invite_code(&self, code: &str) -> Result<CommunityInvitePreviewDto>`

### DTOs (`backend/src/dto/...`)

- `backend/src/dto/community/join_community.rs` → `JoinCommunityDto`
  (`#[validate(length(min = 1, max = 12))] pub invite_code: Option<String>`
  applied via a custom validator only when `Some`, since it's optional).
- `backend/src/dto/community/read_member.rs` → `ReadCommunityMemberDto`
- `backend/src/dto/community/invite_code.rs` → `ReadInviteCodeDto`, `CommunityInvitePreviewDto`

### Router (`backend/src/router/community/membership.rs`, new file, merged into `community_router()`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/community/{community_id}/members` | `join_community_handler` | required | Join (public: no body needed; invite-only: `{ invite_code }` in body) |
| DELETE | `/api/community/{community_id}/members/me` | `leave_community_handler` | required, must be a member | Leave the community |
| GET | `/api/community/{community_id}/members` | `list_community_members_handler` | required; gated by `data_visibility` | List members with role + joined date |
| GET | `/api/community/{community_id}/invite-code` | `get_invite_code_handler` | required, owner only | Fetch (and lazily create) the static invite code |
| POST | `/api/community/{community_id}/invite-code/regenerate` | `regenerate_invite_code_handler` | required, owner only | Rotate the invite code |
| GET | `/api/community/invite/{code}` | `preview_by_invite_code_handler` | required (any signed-in user) | Resolve a code to a shallow community preview |

```rust
// backend/src/router/community/membership.rs
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
    service::community_service::{
        CommunityInvitePreviewDto, JoinCommunityDto, ReadCommunityMemberDto, ReadInviteCodeDto,
    },
};

pub fn membership_routes() -> Router<AppState> {
    Router::new()
        .route("/{community_id}/members", post(join_community_handler).get(list_community_members_handler))
        .route("/{community_id}/members/me", axum::routing::delete(leave_community_handler))
        .route(
            "/{community_id}/invite-code",
            get(get_invite_code_handler),
        )
        .route(
            "/{community_id}/invite-code/regenerate",
            post(regenerate_invite_code_handler),
        )
        .route("/invite/{code}", get(preview_by_invite_code_handler))
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn join_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<JoinCommunityDto>,
) -> ApiResponse<ReadCommunityMemberDto> {
    payload.community_id = community_id;
    let result = state.community_service.join_community(payload, &actor).await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn leave_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state.community_service.leave_community(community_id, &actor).await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn list_community_members_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCommunityMemberDto>> {
    let result = state.community_service.list_members(community_id, &actor).await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn get_invite_code_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<ReadInviteCodeDto> {
    let result = state.community_service.get_invite_code(community_id, &actor).await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn regenerate_invite_code_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<ReadInviteCodeDto> {
    let result = state
        .community_service
        .regenerate_invite_code(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, code = %code))]
async fn preview_by_invite_code_handler(
    State(state): State<AppState>,
    Path(code): Path<String>,
    actor: Actor,
) -> ApiResponse<CommunityInvitePreviewDto> {
    let _ = &actor; // any signed-in user may preview; actor unused beyond auth gate
    let result = state.community_service.preview_by_invite_code(&code).await;
    ApiResponse::from_result(result)
}
```

Wiring: `community_router()` in `backend/src/router/community/root.rs` becomes
`Router::new().merge(crud_routes()).merge(membership_routes())` (rename the
Step 1 builder body to `crud_routes()` internally, keep `community_router()`
as the public export so `root.rs`'s nest call is unchanged).

## Frontend Implementation

### Types & Schemas

`next-frontend/api/definitions/models/community.ts` additions:

```ts
export const CommunityMemberRoleSchema = z.enum(["owner", "member"]);

export const CommunityMemberSchema = z.object({
  id: z.uuid(),
  user: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
  role: CommunityMemberRoleSchema,
  joined_at: z.coerce.date<Date>(),
});

export const InviteCodeSchema = z.object({
  code: z.string(),
  updated_at: z.coerce.date<Date>(),
});

export const CommunityInvitePreviewSchema = z.object({
  community_id: z.uuid(),
  name: z.string(),
  avatar_url: z.string().nullable(),
  member_count: z.number(),
  visibility_type: CommunityVisibilityTypeSchema,
});

export type CommunityMember = z.infer<typeof CommunityMemberSchema>;
export type InviteCode = z.infer<typeof InviteCodeSchema>;
export type CommunityInvitePreview = z.infer<typeof CommunityInvitePreviewSchema>;
```

`next-frontend/api/definitions/requests/community.ts` additions:

```ts
const join = z.object({
  communityId: z.uuid(),
  inviteCode: z.string().trim().optional(),
});
const leave = z.object({ communityId: z.uuid() });
const listMembers = z.object({ communityId: z.uuid() });
const getInviteCode = z.object({ communityId: z.uuid() });
const regenerateInviteCode = z.object({ communityId: z.uuid() });
const previewByCode = z.object({ code: z.string().trim().min(1) });
```
(merged into `CommunityRequestSchema`)

`next-frontend/api/definitions/responses/community.ts` additions:

```ts
join: CommunityMemberSchema,
leave: z.null(),
listMembers: z.array(CommunityMemberSchema),
getInviteCode: InviteCodeSchema,
regenerateInviteCode: InviteCodeSchema,
previewByCode: CommunityInvitePreviewSchema,
```

### API Client (`next-frontend/api/communityApi.ts` — additions)

```ts
export const join = async (params: CommunityRequest["join"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/members`, {
    invite_code: params.inviteCode,
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.join);
};

export const leave = async (params: CommunityRequest["leave"]) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.communityId}/members/me`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.leave);
};

export const listMembers = async (params: CommunityRequest["listMembers"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/members`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMembers);
};

export const getInviteCode = async (params: CommunityRequest["getInviteCode"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/invite-code`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getInviteCode);
};

export const regenerateInviteCode = async (params: CommunityRequest["regenerateInviteCode"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/invite-code/regenerate`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.regenerateInviteCode);
};

export const previewByInviteCode = async (params: CommunityRequest["previewByCode"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/invite/${params.code}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.previewByCode);
};
```

### React Query Hooks (`next-frontend/components/hooks/community/...`)

`queryKeys.communities` additions:

```ts
members: (communityId: string) => ({
  queryFn: async () => await CommunityApi.listMembers({ communityId }),
  queryKey: [communityId, "members"],
}),
inviteCode: (communityId: string) => ({
  queryFn: async () => await CommunityApi.getInviteCode({ communityId }),
  queryKey: [communityId, "invite-code"],
}),
invitePreview: (code: string) => ({
  queryFn: async () => await CommunityApi.previewByInviteCode({ code }),
  queryKey: ["invite-preview", code],
}),
```

Hooks:
- `useCommunityMembers.ts` → `useCommunityMembers(communityId: string)` — `useQuery(queryKeys.communities.members(communityId))`.
- `useJoinCommunity.tsx` → `useJoinCommunity()` — mutation wrapping `CommunityApi.join`; **optimistic**: on `onMutate`, cancels `queryKeys.communities.mine.queryKey` and `queryKeys.communities.members(communityId).queryKey`, snapshots both, appends an optimistic `CommunityMember` row (`id: "optimistic"`, `role: "member"`, `joined_at: new Date()`, using the current auth user from `useAuth()`) to the members cache, and appends the community itself to `communities.mine` if it's not already present (fetched from `communities.byId(communityId)` cache if warm); on `onError` restores both snapshots and toasts `error.message` under `"Couldn't join community"`; on `onSettled` invalidates both query keys.
- `useLeaveCommunity.tsx` → `useLeaveCommunity()` — mutation wrapping `CommunityApi.leave`; **optimistic**: removes the actor's row from `communities.members(communityId)` and removes the community from `communities.mine` in `onMutate`; rollback in `onError` with toast title `"Couldn't leave community"`; invalidates on `onSettled`.
- `useInviteCode.ts` → `useInviteCode(communityId: string)` — `useQuery(queryKeys.communities.inviteCode(communityId))`, `enabled` only when the viewer is the owner (checked by the caller).
- `useRegenerateInviteCode.tsx` → `useRegenerateInviteCode()` — mutation wrapping `CommunityApi.regenerateInviteCode`; on success sets `queryKeys.communities.inviteCode(id).queryKey` cache directly to the new code (no need to refetch) and toasts `"Invite code regenerated. The old code no longer works."`.
- `useInvitePreview.ts` → `useInvitePreview(code: string)` — `useQuery(queryKeys.communities.invitePreview(code))`, `enabled: !!code`, used by the invite landing page before the user has joined.

### UI Components

- `next-frontend/app/home/communities/invite/[code]/page.tsx` — public-feeling landing page shell (still behind auth, per `Actor` requiring a signed-in user) rendering `<InviteLandingPage code={params.code} />`.
- `next-frontend/components/visualizers/communities/InviteLandingPage.tsx` — fetches `useInvitePreview`, shows community avatar/name/member count and a "Join Community" button wired to `useJoinCommunity`; on success, redirects to `/home/communities/[communityId]`.
- `next-frontend/components/visualizers/communities/JoinCommunityButton.tsx` — reusable button for public communities shown on `CommunityCard`/detail page when the viewer is not yet a member; calls `useJoinCommunity` directly (no code needed since `visibility_type === "public"`).
- `next-frontend/components/visualizers/communities/MemberList.tsx` — table (desktop) / stacked cards (mobile) of `useCommunityMembers`, each row: avatar, username, role badge, joined date; renders a `LeaveCommunityButton` for the viewer's own row (unless they're the owner).
- `next-frontend/components/visualizers/communities/LeaveCommunityButton.tsx` — `AlertDialog`-confirmed leave action, same structural pattern as `ArchiveCommunityButton`.
- `next-frontend/components/visualizers/communities/InviteCodeCard.tsx` — owner-only card on the detail page showing the current code in a read-only `Input` with a copy-to-clipboard `Button` (icon: `Copy`, swaps to `Check` for 2s on click, matching common shadcn copy-button idiom) and a "Regenerate" button behind an `AlertDialog` warning that the old code stops working immediately.
- `CommunityDetailPage.tsx` (from Step 1, extended) — gains a "Members" section rendering `MemberList`, and, if `is_owner`, an `InviteCodeCard`; gains a `JoinCommunityButton` in the header for non-members viewing a public community.

**User journey — joining an invite-only community:**

1. User B receives a link from User A: `https://nowaster.app/home/communities/invite/7K9QX2M4AB`.
2. User B is signed in already (or is redirected through sign-in first, then back to this URL). The page loads `InviteLandingPage`, which shows a skeleton, then the community's avatar, name, and "128 members".
3. User B clicks "Join Community".
4. `useJoinCommunity` fires with `{ communityId, inviteCode: "7K9QX2M4AB" }`; the button shows a loading spinner.
5. On success, a toast reads "Welcome to Faculty of Informatics!" and the page navigates to `/home/communities/[communityId]`, where User B now sees the member list (including themselves) but no Edit/Archive/Invite-code affordances, since they're not the owner.

**User journey — owner shares an invite code:**

1. Owner opens their invite-only community's detail page and sees `InviteCodeCard` showing a 10-character code.
2. Owner clicks the copy icon; the icon swaps to a checkmark for 2 seconds; a toast confirms "Invite code copied".
3. Owner shares the code (or the full invite URL, also copyable) with prospective members out of band.
4. If the owner suspects the code leaked somewhere unwanted, they click "Regenerate", confirm in the `AlertDialog` ("Anyone with the old code will no longer be able to join. Continue?"), and the card updates in place with the new code.

## UX & Polish

- **Loading state**: `MemberList` shows 5 skeleton rows (avatar circle + two text bars) while `useCommunityMembers` loads. `InviteCodeCard` shows a skeleton bar in place of the code while `useInviteCode` loads. `InviteLandingPage` shows a skeleton avatar+name+button block.
- **Empty state**: A community with only its owner shows `MemberList` with exactly one row (the owner) — this is a legitimate, not-empty state, so no special empty-state copy is needed here; the "empty" case worth designing for is the invite landing page when the code doesn't resolve: heading **"This invite link isn't valid"**, body **"The code may have been regenerated or the community may no longer exist. Ask for a new invite link."**, with a button back to `/home/communities`.
- **Error states**:
  - Join failure (already a member) → toast title `"Couldn't join community"`, body `"You're already a member of this community"`.
  - Join failure (bad code) → toast title `"Couldn't join community"`, body `"That invite code is invalid or has been changed"`.
  - Leave failure (is owner) → toast title `"Couldn't leave community"`, body `"As the owner, you need to archive the community instead of leaving it"`; the Leave button itself is hidden for the owner's own row as the primary defense, this is the defensive fallback message.
  - Invite code fetch/regenerate failure → toast title `"Couldn't load invite code"` / `"Couldn't regenerate invite code"`.
  - Inline validation: none needed for join (code comes from the URL, not typed) except a manual "Join with code" fallback input (for a user who has just the code, not the link) on `/home/communities` — validated as non-empty, `"Enter an invite code"`.
- **Optimistic update**: Join and Leave both update instantly as described in the Hooks section above — these are exactly the "feels instant" actions called out in the conventions doc, structurally mirroring `useCreateStopwatchSession`'s `onMutate`/`onError`/`onSettled` shape.
- **Responsive**: `MemberList` renders as a `Table` (`components/shadcn/table.tsx`) at `sm` and above; below `sm` it renders as a stacked list of `Card`s (avatar+name+role+action per card), avoiding a squeezed table — matches the explicit conventions-doc requirement for member lists. `InviteCodeCard`'s code input and copy button stack vertically below `sm` instead of sitting side-by-side.
- **Accessibility**: Copy-to-clipboard button has `aria-label="Copy invite code"` and announces success via a visually-hidden `aria-live="polite"` region ("Invite code copied to clipboard") in addition to the toast, since toasts alone aren't reliably announced by all screen readers. Role badges use both a color and a text label ("Owner" / "Member"), never color alone. The regenerate confirmation `AlertDialog` moves initial focus to "Cancel". `LeaveCommunityButton`/`ArchiveCommunityButton` share one accessible confirmation pattern so keyboard users learn it once.

## Acceptance Criteria

- [ ] Migration `0058_create_community_membership.sql` applies cleanly on top of `0057`, and backfills owner membership rows for communities created in Step 1's window.
- [ ] Creating a community (Step 1's endpoint) now also creates an `owner` `community_member` row in the same transaction.
- [ ] `GET /api/community` returns communities the actor is a member of, including ones they don't own.
- [ ] Joining a public community succeeds without any invite code.
- [ ] Joining an invite-only community fails with a wrong/missing code and succeeds with the correct one.
- [ ] Joining a community the actor is already a member of returns an error and does not create a duplicate row (also enforced by the `uq_community_member` constraint as a backstop).
- [ ] The owner cannot leave their own community; a regular member can.
- [ ] Only the owner can fetch or regenerate the invite code; regenerating invalidates the old code (old code no longer resolves via `find_community_by_invite_code`).
- [ ] `GET /api/community/{id}/members` is rejected for non-members when `data_visibility = members_only`, and allowed for anyone signed in when `data_visibility = public`.
- [ ] Frontend: joining via the invite landing page redirects to the community detail page and the member list includes the new member without a manual refresh.
- [ ] Frontend: leaving a community removes it from "My Communities" immediately (optimistic) and the change survives a page refresh.

## Testing Notes

- Backend:
  - `create_community_also_creates_owner_membership` — asserts a `community_member` row with `role = Owner` exists after creation.
  - `join_public_community_without_code_succeeds`.
  - `join_invite_only_community_without_code_fails`.
  - `join_invite_only_community_with_wrong_code_fails`.
  - `join_invite_only_community_with_correct_code_succeeds`.
  - `join_community_twice_fails_on_second_attempt`.
  - `owner_cannot_leave_community`.
  - `member_can_leave_community_and_row_is_removed`.
  - `list_members_rejected_for_non_member_when_members_only`.
  - `list_members_allowed_for_non_member_when_public`.
  - `regenerate_invite_code_invalidates_old_code` — old code no longer resolves via `preview_by_invite_code`.
  - `non_owner_cannot_fetch_or_regenerate_invite_code`.
- Frontend (Storybook):
  - `MemberList.stories.tsx` — loading, single-member (owner only), many-members desktop table, many-members mobile stacked layout, viewer-is-owner (no leave button on own row) vs. viewer-is-member (leave button present).
  - `InviteCodeCard.stories.tsx` — default, copied state (post-click), regenerate-confirmation open, loading.
  - `InviteLandingPage.stories.tsx` — loading, valid preview, invalid/expired code (error empty state), already-a-member state (button reads "View Community" instead of "Join").
  - `JoinCommunityButton.stories.tsx` — default, loading/pending, error (toast triggered via mock rejected mutation).
