# Step 2: Invite System

## Overview

v1 shipped a single static, non-expiring invite code per community — fine
for a demo, useless for real moderation (you can't tell who a code went to,
can't revoke it for one person, can't invite someone who hasn't heard of
the community yet). This step replaces it with a general `community_invite`
table supporting two invite types — a **direct invite** to a specific
username (they get a notification and an accept/decline inbox, exactly
like `friend_request`) and a **shareable link** with an optional expiry —
and migrates v1's static code into the new table as one row rather than
running two parallel systems. Depends on Step 1 only for the
`can_invite`/`can_manage_members` capability check (a manager or owner can
invite; a member cannot, unless the community is `public`, in which case
anyone can join directly without an invite at all — invites exist for
`invite_only` communities and for targeted invites into public ones).

## Scope

- In scope:
  - `community_invite` table: direct (by username) and link (shareable
    code) invites, both with a `status` lifecycle
  - Send a direct invite to a specific user by username; they receive a
    notification (new `notification_type` value, following the exact
    pattern `task:completed`/`project:completed` used in
    `0041_add_notification_types.sql`)
  - Accept/decline inbox for incoming direct invites (mirrors the
    friend-request accept/reject flow in `friend_service.rs`)
  - Generate a shareable link invite with an optional expiry
    (1 day / 7 days / 30 days / never) and optional max-uses
  - Revoke a pending invite (direct or link) before it's used
  - Migrate v1's single `community_invite_code` row per community into
    `community_invite` as a never-expiring link invite; drop the old
    table in the same migration
  - Joining via a link invite's code (was `POST
    /api/community/join/{code}` in v1, same endpoint, now reads from
    `community_invite` instead of `community_invite_code`)
- Explicitly deferred:
  - Bulk invite (inviting many usernames at once) — the single-invite
    primitives built here are reused by bulk invite (→ Step 5 of this
    version)
  - Invite by email for non-users — the app has no concept of a
    non-user invitee yet (→ not currently planned)
  - Invite expiry reminders / re-send flow (→ v3, alongside other
    notification polish)

## Data Model

### Inherited from v1 (read-only reference)

```sql
CREATE TABLE community_invite_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    code VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Also inherited: `community`, `community_member` (with `role` from Step 1),
and the `notification`/`notification_type` machinery described in
`backend/migrations/0026_create_notification_table.sql` and
`0041_add_notification_types.sql`.

### Migration: `backend/migrations/0062_create_community_invite.sql`

```sql
-- 0062_create_community_invite.sql

CREATE TYPE community_invite_type AS ENUM ('direct', 'link');
CREATE TYPE community_invite_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'revoked',
    'expired'
);

CREATE TABLE community_invite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    invite_type community_invite_type NOT NULL,
    status community_invite_status NOT NULL DEFAULT 'pending',

    -- direct invites only
    invited_user_id TEXT REFERENCES "user"(id),

    -- link invites only
    code VARCHAR UNIQUE,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,

    created_by TEXT NOT NULL REFERENCES "user"(id),
    expires_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT community_invite_shape_check CHECK (
        (invite_type = 'direct' AND invited_user_id IS NOT NULL AND code IS NULL)
        OR
        (invite_type = 'link' AND code IS NOT NULL AND invited_user_id IS NULL)
    )
);

CREATE INDEX idx_community_invite_community_status
    ON community_invite(community_id, status);
CREATE INDEX idx_community_invite_invited_user_status
    ON community_invite(invited_user_id, status)
    WHERE invite_type = 'direct';
CREATE UNIQUE INDEX idx_community_invite_code
    ON community_invite(code)
    WHERE code IS NOT NULL;

-- Prevent duplicate pending direct invites to the same user for the same
-- community (mirrors the pending-friend-request uniqueness check done in
-- application code in friends.rs — enforced here at the DB level too since
-- invites are lower-touch and more likely to be double-submitted).
CREATE UNIQUE INDEX idx_community_invite_unique_pending_direct
    ON community_invite(community_id, invited_user_id)
    WHERE invite_type = 'direct' AND status = 'pending';

-- Migrate v1's single static code into the new table as a never-expiring,
-- unlimited-use link invite, then retire the old table.
INSERT INTO community_invite (
    community_id, invite_type, status, code, created_by, expires_at, max_uses
)
SELECT
    cic.community_id,
    'link',
    'pending',
    cic.code,
    c.created_by,
    NULL,
    NULL
FROM community_invite_code cic
JOIN community c ON c.id = cic.community_id;

DROP TABLE community_invite_code;

-- New notification type for direct community invites, following the
-- ALTER TYPE ... ADD VALUE pattern from 0041/0051/0052.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:invite_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:invite_accepted';
```

### Rust entity changes

`backend/src/entity/community.rs` (additions):

```rust
#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_invite_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum CommunityInviteType {
    Direct,
    Link,
}

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_invite_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum CommunityInviteStatus {
    Pending,
    Accepted,
    Declined,
    Revoked,
    Expired,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommunityInvite {
    pub id: uuid::Uuid,
    pub community_id: uuid::Uuid,
    pub invite_type: CommunityInviteType,
    pub status: CommunityInviteStatus,
    pub invited_user_id: Option<String>,
    pub code: Option<String>,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub created_by: String,
    pub expires_at: Option<chrono::DateTime<chrono::Local>>,
    pub responded_at: Option<chrono::DateTime<chrono::Local>>,
    pub created_at: chrono::DateTime<chrono::Local>,
}
```

`backend/src/entity/notification.rs` (additions to `NotificationTypeSql`
and `NotificationType`, following the existing `FriendNewRequest` /
`FriendRequestData` pairing):

```rust
// in NotificationTypeSql:
#[sqlx(rename = "community:invite_received")]
#[serde(rename = "community:invite_received")]
CommunityInviteReceived,

#[sqlx(rename = "community:invite_accepted")]
#[serde(rename = "community:invite_accepted")]
CommunityInviteAccepted,

// new data + variant on NotificationType:
#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInviteReceivedData {
    pub invite_id: Uuid,
    pub community_id: Uuid,
    pub community_name: String,
    pub inviter: ReadUserDto,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityInviteAcceptedData {
    pub community_id: Uuid,
    pub community_name: String,
    pub accepter: ReadUserDto,
}

// on NotificationType enum:
#[serde(rename = "community:invite_received")]
CommunityInviteReceived(CommunityInviteReceivedData),
#[serde(rename = "community:invite_accepted")]
CommunityInviteAccepted(CommunityInviteAcceptedData),
```

## Backend Implementation

### Repository (`backend/src/repository/community/invite.rs`, new file)

| Function | Purpose |
|---|---|
| `create_direct_invite(&self, community_id: Uuid, invited_user_id: &str, created_by: &str) -> Result<CommunityInvite>` | Insert a pending direct invite |
| `create_link_invite(&self, community_id: Uuid, created_by: &str, expires_at: Option<DateTime<Local>>, max_uses: Option<i32>) -> Result<CommunityInvite>` | Insert a link invite with a freshly generated code |
| `get_invite(&self, invite_id: Uuid) -> Result<Option<CommunityInvite>>` | Fetch by id, used for permission/ownership checks |
| `get_invite_by_code(&self, code: &str) -> Result<Option<CommunityInvite>>` | Used by the join-via-code flow |
| `list_incoming_invites(&self, user_id: &str) -> Result<Vec<ReadCommunityInviteDto>>` | Pending direct invites addressed to this user, joined with community + inviter |
| `list_community_invites(&self, community_id: Uuid, status: Option<CommunityInviteStatus>) -> Result<Vec<ReadCommunityInviteDto>>` | Pending/all invites for a community's management view |
| `update_invite_status(&self, invite_id: Uuid, status: CommunityInviteStatus) -> Result<CommunityInvite>` | Accept/decline/revoke transition |
| `increment_use_count(&self, invite_id: Uuid) -> Result<CommunityInvite>` | Bump `use_count` on a link invite when it's used to join |
| `expire_stale_invites(&self) -> Result<u64>` | Batch-transition `pending` link/direct invites past `expires_at` to `expired`; called lazily on read (see service) rather than via a cron in v2 |

### Service (`backend/src/service/community_invite_service.rs`, new service — first sub-resource to earn its own per the README's convention)

Permission rules, stated exactly:

- **Send a direct invite**: actor must have `role >= manager` in the
  target community (checked via `community_member` lookup, same shape as
  Step 1's checks). Cannot invite a user who is already a member. Cannot
  invite a user with an existing `pending` direct invite to the same
  community (DB unique index backs this; service pre-checks for a clean
  error message).
  Special case: if `community.visibility == 'public'`, direct invites are
  still allowed (skip-the-line into a public community) even though
  joining directly doesn't require one.
- **Create/rotate a link invite**: actor must have `role >= manager`.
  Creating a new link invite does not revoke existing ones — a community
  can have multiple active link invites (e.g. one per cohort/semester).
- **Revoke an invite**: actor must have `role >= manager` for that
  community, or be the original inviter (`created_by == actor.user_id`)
  regardless of current role (so a manager who gets demoted can still
  clean up invites they personally sent — though demoted managers losing
  `role >= manager` will fail the first branch and fall through to this
  one).
- **Accept/decline a direct invite**: actor must be the `invited_user_id`
  on that invite, and the invite must be `pending` and not expired.
- **Join via link code**: any authenticated user; the invite must be
  `pending` (or `accepted`, since link invites don't transition to
  `accepted` — see below), not expired, and under `max_uses` if set. Link
  invites never leave `pending` status on use (unlike direct invites);
  only `use_count` increments, so the same link keeps working for the next
  person up to `max_uses`.

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateDirectInviteDto {
    pub community_id: Uuid,
    #[validate(length(min = 1))]
    pub invitee_username: String,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateLinkInviteDto {
    pub community_id: Uuid,
    pub expires_in_days: Option<i32>, // None = never expires
    pub max_uses: Option<i32>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RespondToInviteDto {
    pub invite_id: Uuid,
    pub accept: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct JoinViaCodeDto {
    pub code: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityInviteDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub community_name: String,
    pub invite_type: CommunityInviteType,
    pub status: CommunityInviteStatus,
    pub invited_user: Option<ReadUserDto>,
    pub code: Option<String>,
    pub created_by: ReadUserDto,
    pub expires_at: Option<DateTime<Local>>,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub created_at: DateTime<Local>,
}
```

Error cases:

- `"You do not have permission to invite members to this community"`
- `"{username} is already a member of this community"`
- `"{username} already has a pending invite to this community"`
- `"User not found"` (invitee username doesn't resolve — mirrors
  `create_friend_request_handler`'s lookup-then-404 pattern)
- `"This invite has already been responded to"`
- `"This invite is not addressed to you"`
- `"This invite has expired"`
- `"This invite link has reached its maximum number of uses"`
- `"Invalid or expired invite code"`
- `"You are already a member of this community"` (joining via code while
  already a member)
- `"You do not have permission to revoke this invite"`

```rust
#[instrument(err, skip(self), fields(community_id = %dto.community_id, actor_id = %actor))]
pub async fn create_direct_invite(
    &self,
    dto: CreateDirectInviteDto,
    actor: &Actor,
) -> Result<ReadCommunityInviteDto> {
    let acting_member = self
        .member_repo
        .get_member(dto.community_id, &actor.user_id)
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
        .member_repo
        .get_member(dto.community_id, &invitee.id)
        .await?
        .is_some()
    {
        return Err(anyhow::anyhow!(
            "{} is already a member of this community",
            invitee.username
        ));
    }

    let invite = self
        .invite_repo
        .create_direct_invite(dto.community_id, &invitee.id, &actor.user_id)
        .await?;

    let community = self.community_repo.get_by_id(dto.community_id).await?;
    let inviter = self.user_service.get_user_by_id(&actor.user_id).await?;

    self.notification_service
        .notify_community_invite_received(invite.id, community.clone(), inviter.clone())
        .await?;

    Ok(ReadCommunityInviteDto::from_entities(invite, community, invitee, inviter))
}
```

### Router (`backend/src/router/community/invite.rs`, new file)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/community/{community_id}/invite` | `create_direct_invite_handler` | Actor, manager+ | Invite a specific user by username |
| POST | `/api/community/{community_id}/invite/link` | `create_link_invite_handler` | Actor, manager+ | Create a shareable link invite |
| GET | `/api/community/{community_id}/invite` | `list_community_invites_handler` | Actor, manager+ | Management view of all invites for the community |
| GET | `/api/community/invite/inbox` | `list_incoming_invites_handler` | Actor | The current user's pending incoming direct invites |
| PATCH | `/api/community/invite/{invite_id}` | `respond_to_invite_handler` | Actor, must be invitee | Accept or decline a direct invite |
| DELETE | `/api/community/{community_id}/invite/{invite_id}` | `revoke_invite_handler` | Actor, manager+ or original inviter | Revoke a pending invite |
| POST | `/api/community/join/{code}` | `join_via_code_handler` | Actor | Join using a link invite's code (supersedes v1's identically-shaped endpoint) |

```rust
#[instrument(skip(state), fields(invite_id = %invite_id, actor_id = %actor))]
async fn respond_to_invite_handler(
    State(state): State<AppState>,
    Path(invite_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<RespondBody>,
) -> ApiResponse<ReadCommunityInviteDto> {
    let result = state
        .community_invite_service
        .respond_to_invite(
            RespondToInviteDto { invite_id, accept: payload.accept },
            &actor,
        )
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(code = %code, actor_id = %actor))]
async fn join_via_code_handler(
    State(state): State<AppState>,
    Path(code): Path<String>,
    actor: Actor,
) -> ApiResponse<ReadCommunityMembershipDto> {
    let result = state
        .community_invite_service
        .join_via_code(JoinViaCodeDto { code }, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

`community_invite_service` is added to `AppState` in
`backend/src/router/root.rs`, constructed alongside `community_service`
and passed the same `notification_service` instance used by
`friend_service` today.

## Frontend Implementation

### Types & Schemas

`next-frontend/api/definitions/models/community-invite.ts`:

```ts
export const CommunityInviteTypeSchema = z.enum(["direct", "link"]);
export const CommunityInviteStatusSchema = z.enum([
  "pending",
  "accepted",
  "declined",
  "revoked",
  "expired",
]);

export const CommunityInviteSchema = z.object({
  id: z.uuid(),
  communityId: z.uuid(),
  communityName: z.string(),
  inviteType: CommunityInviteTypeSchema,
  status: CommunityInviteStatusSchema,
  invitedUser: UserSchema.nullable(),
  code: z.string().nullable(),
  createdBy: UserSchema,
  expiresAt: z.coerce.date<Date>().nullable(),
  maxUses: z.number().int().nullable(),
  useCount: z.number().int(),
  createdAt: z.coerce.date<Date>(),
});
export type CommunityInvite = z.infer<typeof CommunityInviteSchema>;
```

`next-frontend/api/definitions/requests/community/invite.ts`:

```ts
const createDirect = z.object({
  inviteeUsername: z.string().min(1, "Enter a username"),
});

const createLink = z.object({
  expiresInDays: z.union([z.literal(1), z.literal(7), z.literal(30), z.null()]),
  maxUses: z.number().int().positive().nullable(),
});

const respond = z.object({ accept: z.boolean() });

export const CommunityInviteRequestSchema = { createDirect, createLink, respond };
export type CommunityInviteRequest = {
  [K in keyof typeof CommunityInviteRequestSchema]: z.infer<
    (typeof CommunityInviteRequestSchema)[K]
  >;
};
```

`next-frontend/validation/invite-member.ts` (form-level, mirrors
`validation/add-friend.ts`):

```ts
export const inviteMemberSchema = z.object({
  username: z.string().min(1, "Enter a username"),
});
export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>;
```

### API Client (`next-frontend/api/communityInvite.ts`, new file)

```ts
const BASE_URL = "/community";

export const createDirectInvite = async (
  communityId: string,
  params: CommunityInviteRequest["createDirect"],
) => {
  const { data } = await baseApi.post(`${BASE_URL}/${communityId}/invite`, params);
  return await parseResponseUnsafe(data, CommunityInviteResponseSchema.createDirect);
};

export const createLinkInvite = async (
  communityId: string,
  params: CommunityInviteRequest["createLink"],
) => {
  const { data } = await baseApi.post(`${BASE_URL}/${communityId}/invite/link`, params);
  return await parseResponseUnsafe(data, CommunityInviteResponseSchema.createLink);
};

export const listCommunityInvites = async (communityId: string) => {
  const { data } = await baseApi.get(`${BASE_URL}/${communityId}/invite`);
  return await parseResponseUnsafe(data, CommunityInviteResponseSchema.list);
};

export const listInbox = async () => {
  const { data } = await baseApi.get(`${BASE_URL}/invite/inbox`);
  return await parseResponseUnsafe(data, CommunityInviteResponseSchema.list);
};

export const respondToInvite = async (
  inviteId: string,
  params: CommunityInviteRequest["respond"],
) => {
  const { data } = await baseApi.patch(`${BASE_URL}/invite/${inviteId}`, params);
  return await parseResponseUnsafe(data, CommunityInviteResponseSchema.respond);
};

export const revokeInvite = async (communityId: string, inviteId: string) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${communityId}/invite/${inviteId}`);
  return await parseResponseUnsafe(data, CommunityInviteResponseSchema.revoke);
};

export const joinViaCode = async (code: string) => {
  const { data } = await baseApi.post(`${BASE_URL}/join/${code}`);
  return await parseResponseUnsafe(data, CommunityInviteResponseSchema.join);
};
```

### React Query Hooks

- `useCommunityInvites(communityId: string)` — management-view list
- `useInviteInbox()` — current user's incoming invites, polled the same
  way notifications are (short `staleTime`, refetch on window focus —
  matches how `useUnseenNotifications`-style hooks behave elsewhere)
- `useSendDirectInvite(communityId: string)` — mutation, toast + list
  invalidation (not optimistic — server assigns the invite id and we need
  it for revoke actions immediately after)
- `useCreateLinkInvite(communityId: string)` — mutation
- `useRespondToInvite()` — mutation, **optimistic**: removes the invite
  from the inbox immediately
- `useRevokeInvite(communityId: string)` — mutation, **optimistic**:
  marks the row `revoked` immediately in the management list
- `useJoinViaCode()` — mutation, redirects to the community page on
  success

`queryKeys.communities.*` additions:

```ts
const communityKeys = createQueryKeys("communities", {
  // ...members, capabilities from Step 1
  invites: (communityId: string) => ({
    queryFn: async () => await CommunityInviteApi.listCommunityInvites(communityId),
    queryKey: [communityId, "invites"],
  }),
  inbox: {
    queryFn: async () => await CommunityInviteApi.listInbox(),
    queryKey: ["invite-inbox"],
  },
});
```

`useRespondToInvite` (optimistic, inbox-item removal):

```ts
export const useRespondToInvite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ inviteId, accept }: { inviteId: string; accept: boolean }) =>
      await CommunityInviteApi.respondToInvite(inviteId, { accept }),
    onMutate: async ({ inviteId }) => {
      const key = queryKeys.communities.inbox.queryKey;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<CommunityInvite[]>(key);
      queryClient.setQueryData<CommunityInvite[]>(key, (old) =>
        old?.filter((i) => i.id !== inviteId),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(queryKeys.communities.inbox.queryKey, context?.previous);
      toast({
        description: error.message,
        title: "Couldn't respond to invite",
        variant: "destructive",
      });
    },
    onSuccess: async (_data, { accept }) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.communities.inbox._def });
      if (accept) {
        toast({ description: "Welcome to the community!", title: "Invite accepted" });
      }
    },
  });
};
```

### UI Components

- `components/visualizers/communities/InviteInbox.tsx` — list of
  incoming invites with Accept/Decline buttons, lives in the same
  notifications-adjacent area as `FriendRequestManagement.tsx`
- `components/notifications/items/CommunityInviteReceivedNotification.tsx`
  — notification-feed renderer for `community:invite_received`, matching
  `NewFriendRequestNotification.tsx`
- `components/visualizers/communities/InviteMemberForm.tsx` — username
  input + submit, structurally identical to `AddFriend.tsx`
- `components/visualizers/communities/InviteLinkPanel.tsx` — "Create
  invite link" button, expiry dropdown, generated link with a copy
  button, list of active links with revoke actions
- `components/visualizers/communities/InviteManagementList.tsx` —
  combined table of pending/accepted/declined/revoked/expired invites for
  managers, with status pills and revoke action on pending rows
- `app/home/communities/join/[code]/page.tsx` — landing page for a
  shared invite link (follows the `app/home/<feature>` routing
  convention used by `app/home/friends`, `app/home/tags/[id]`, etc.);
  shows community name/avatar/description and a "Join" button wired to
  `useJoinViaCode`

Primary flow — inviting and accepting a direct invite:

1. A manager on the community's **Members** tab clicks "Invite member",
   opening `InviteMemberForm` (reuses the `AddFriend.tsx` layout: a
   single username `Input` plus a submit `Button`, `react-hook-form` +
   `zodResolver(inviteMemberSchema)`).
2. Manager types a username, submits. `useSendDirectInvite` fires; on
   success, a toast reads "Invite sent to {username}." and
   `InviteManagementList` invalidates to show the new `pending` row.
3. The invitee sees a notification (bell icon badge increments via the
   existing notification-count polling) rendered by
   `CommunityInviteReceivedNotification`: "{inviter} invited you to join
   {community}."
4. Invitee opens `InviteInbox` (or clicks the notification, which
   deep-links there) and sees the pending invite with community
   name/avatar and Accept/Decline buttons.
5. Invitee clicks Accept. `useRespondToInvite({ accept: true })` fires;
   the invite optimistically disappears from their inbox before the
   network call resolves.
6. On success, the invitee is now a `community_member` with role
   `member`; a toast reads "Welcome to the community!" and the app
   navigates to the community's dashboard. The inviter's
   `InviteManagementList` will show the invite as `accepted` on next
   fetch (not pushed live — polling/refetch-on-focus is sufficient for
   v2, no websocket).

## UX & Polish

- **Loading state**: `InviteInbox` and `InviteManagementList` each show 2
  skeleton rows while loading.
- **Empty states**:
  - Inbox, no pending invites: "No pending invites. When someone invites
    you to a community, it'll show up here." with a muted mailbox-style
    icon.
  - Management list, no invites sent yet: "No invites yet — invite a
    specific person or share a link." with the invite form/link panel
    front and center rather than hidden behind a tab.
- **Error states** (toast copy):
  - `"Couldn't send invite — {server message}"` (e.g. "alice already has
    a pending invite to this community")
  - `"Couldn't respond to invite — {server message}"`
  - `"Couldn't create invite link — {server message}"`
  - `"Couldn't revoke invite — {server message}"`
  - Join-via-code page, invalid/expired code: full-page state (not a
    toast, since the user landed here directly): "This invite link is no
    longer valid. Ask the community owner for a new one." with a link
    back home.
- **Optimistic update**: accept/decline removes the inbox item
  immediately (rollback restores it on error); revoke marks the row
  `revoked` immediately in the management list (rollback restores
  `pending` on error). Sending a new invite is *not* optimistic — the
  server-assigned `id` is needed for the row's revoke action.
- **Responsive**: `InviteManagementList` collapses to stacked cards
  (status pill + username/code + revoke button) below `640px`, same
  breakpoint convention as `MemberList`.
- **Accessibility**:
  - Accept/Decline buttons are distinct shapes/icons (check vs. X), not
    color-only, and both reachable via `Tab`.
  - The copy-link button in `InviteLinkPanel` gets `aria-live="polite"`
    feedback ("Link copied") for screen readers, not just a toast.
  - Status pills (`pending`/`accepted`/`declined`/`revoked`/`expired`)
    use icon + text (clock, check, x, ban, hourglass-off respectively).

## Acceptance Criteria

- [ ] `community_invite` table exists; v1's `community_invite_code` rows
      were migrated 1:1 into it as `link` invites and the old table no
      longer exists.
- [ ] A member (not manager/owner) attempting to create either invite
      type receives a permission error.
- [ ] Inviting an existing member fails with `"{username} is already a
      member of this community"`.
- [ ] Inviting the same user twice while their first invite is pending
      fails at the service layer with a clear message (not a raw DB
      constraint error).
- [ ] Accepting a direct invite creates a `community_member` row with
      `role = member` and marks the invite `accepted`.
- [ ] Declining a direct invite marks it `declined` and does not create a
      membership row.
- [ ] A link invite past `expires_at` is rejected on join attempt with
      `"This invite link is no longer valid"` even if never explicitly
      transitioned to `expired`.
- [ ] A link invite at `use_count == max_uses` is rejected on the next
      join attempt.
- [ ] Revoking an invite is only permitted for the original inviter or a
      manager/owner of that community.
- [ ] The invitee receives a `community:invite_received` notification
      whose `content` round-trips through the same DTO used by the invite
      inbox.

## Testing Notes

- **Backend**:
  - `test_direct_invite_creates_notification`
  - `test_cannot_invite_existing_member`
  - `test_cannot_double_invite_same_pending_user`
  - `test_accept_invite_creates_membership`
  - `test_decline_invite_does_not_create_membership`
  - `test_link_invite_respects_max_uses`
  - `test_link_invite_respects_expiry`
  - `test_revoke_permission_owner_manager_original_inviter_only`
  - `test_join_via_invalid_code_fails`
  - `test_v1_static_code_migrated_as_link_invite` (migration-level test
    or a seed-data assertion run once against a fixture DB)
- **Frontend** (Storybook):
  - `InviteInbox.stories.tsx` — empty, single pending invite, multiple
    invites
  - `InviteMemberForm.stories.tsx` — idle, submitting, error (duplicate
    invite message), success
  - `InviteLinkPanel.stories.tsx` — no active links, one link with
    expiry, one link with `maxUses` near-exhausted (shows "2 of 5 uses
    left")
  - `InviteManagementList.stories.tsx` — mixed statuses, verifying each
    status pill's icon+text pairing
  - `CommunityInviteReceivedNotification.stories.tsx`
