# Step 1: Discussion Forums

> **Migration numbering assumption (applies to every step in this version):**
> `ls backend/migrations | sort -V | tail -1` at plan time returns `0056_add_user_id_to_metrics_handler.sql`.
> Per the top-level roadmap, v1's schema step claims `0057`. v1 (4 steps) + v2
> (5 steps) + v3 (5 steps) = 14 steps; assuming most steps need one migration
> and a few need two (enum additions get their own file, following the
> existing `0041`/`0051`/`0052` notification-enum pattern), v1–v3 combined are
> assumed to claim **20 migrations: `0057`–`0076`**. v4 therefore starts at
> **`0077`** and each step below claims the next unused number in sequence.
> Before cutting the real migration at implementation time, re-run
> `ls backend/migrations | sort -V | tail -1` — if v1–v3 shipped with a
> different count, shift these numbers accordingly; never reuse one.
>
> **Assumed existing schema this version builds on** (v1–v3 step files don't
> exist yet at plan time, only their READMEs, so the exact DDL isn't
> available to copy from — the following is inferred from the locked
> README descriptions and is what every v4 step below assumes):
> - `community(id UUID PK, name TEXT, description TEXT, avatar_url TEXT, visibility_type community_visibility_type, data_visibility community_data_visibility, owner_id TEXT REFERENCES "user"(id), member_count INT NOT NULL DEFAULT 0, created_at, updated_at, archived_at TIMESTAMPTZ NULL)`
> - `community_member(id UUID PK, community_id UUID REFERENCES community(id), user_id TEXT REFERENCES "user"(id), role community_member_role NOT NULL — 'owner'|'manager'|'member', joined_at TIMESTAMPTZ)`
> - `community_tracked_category(id UUID PK, community_id UUID, name TEXT, color TEXT)`
> - `community_category_mapping(id UUID PK, community_tracked_category_id UUID, community_member_id UUID, personal_category_id UUID REFERENCES category(id))`
> - `community_activity_event(id UUID PK, community_id UUID, event_type TEXT, actor_member_id UUID NULL REFERENCES community_member(id), data JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ)` — v3's system-event feed; v4 steps append new `event_type` values to this rather than inventing a second feed table.
>
> Every FK to `user(id)` is `TEXT`, per `backend/src/entity/user.rs`. Every FK
> to `session(id)` or `category(id)` is `UUID`, per `backend/migrations/0001_add_basic_session.sql`.

## Overview

Discussion forums give a community a persistent place to talk instead of
only seeing aggregate numbers. Threads are either general or scoped to one
of the community's tracked categories (e.g. a thread under "Algorithms").
Any member can start a thread and reply; managers and owners get pin/lock
moderation controls. This step depends on `community_member` (v1/v2, for
role checks) and feeds `community_activity_event` (v3) so new threads show
up in the activity feed.

## Scope

- In scope:
  - Create a thread (general or tracked-category-scoped), with a title and
    body.
  - Reply to a thread.
  - Pin a thread (surfaces at the top of the list) — manager/owner only.
  - Lock a thread (blocks new replies, existing replies stay visible) —
    manager/owner only.
  - Delete a thread — manager/owner only, or the original author within 5
    minutes of posting (typo/duplicate cleanup window, mirrors how most
    forum software limits self-delete).
  - Delete a reply — manager/owner only, or the reply's author any time.
  - Paginated thread list (default sort: pinned first, then most recently
    replied-to) and paginated reply list within a thread.
  - Plain-text body with a **markdown-lite** renderer on the frontend
    (bold/italic/line breaks/auto-linked URLs) — no rich text editor.
- Explicitly deferred / out of scope:
  - Reactions/upvotes on threads or replies (no existing reaction primitive
    scoped to communities; `session` has reactions per `SessionReactionData`
    but that's a different domain — revisit post-v4 if requested).
  - @mentions and mention-based notifications (adds a parsing/indexing
    concern out of scope for a v4 slice; reply notifications already cover
    the common case of "someone replied to my thread").
  - Full-text search across threads (out of scope until the app has a
    search infra decision; a client-side title filter on the visible page
    is enough for v4).
  - Nested/threaded replies (flat reply list only, like the existing
    friend/activity patterns in this codebase — no comment-tree UI exists
    anywhere in the frontend to build on, see below).
  - A rich text/WYSIWYG editor — grepping
    `next-frontend/components/` for "comment", "thread", or "editor" turns
    up nothing to reuse, and building one is disproportionate to a v4
    slice. A `<textarea>` plus the markdown-lite renderer is the pragmatic
    choice.

## Data Model

Migration filename: `backend/migrations/0077_create_community_forum_tables.sql`

```sql
CREATE TYPE community_forum_thread_status AS ENUM (
    'open',
    'locked'
);

CREATE TABLE community_forum_thread (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    tracked_category_id UUID NULL REFERENCES community_tracked_category(id) ON DELETE SET NULL,
    author_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 150),
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),

    status community_forum_thread_status NOT NULL DEFAULT 'open',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,

    reply_count INT NOT NULL DEFAULT 0,
    last_reply_at TIMESTAMP WITH TIME ZONE NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_forum_thread_community_pinned_activity
    ON community_forum_thread(community_id, pinned DESC, last_reply_at DESC NULLS LAST, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_forum_thread_tracked_category
    ON community_forum_thread(tracked_category_id)
    WHERE deleted_at IS NULL;

CREATE TABLE community_forum_reply (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES community_forum_thread(id) ON DELETE CASCADE,
    author_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_forum_reply_thread_created_at
    ON community_forum_reply(thread_id, created_at ASC)
    WHERE deleted_at IS NULL;
```

Migration filename: `backend/migrations/0078_add_forum_notification_types.sql`

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:forum_reply_added';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:forum_thread_pinned';
```

(Kept in a separate migration from the table DDL because `ALTER TYPE ...
ADD VALUE` cannot run in the same transaction as statements that use the new
value, matching the existing `0041`/`0051`/`0052` pattern in this repo.)

### Rust entities (`backend/src/entity/community_forum.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_forum_thread_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ForumThreadStatus {
    Open,
    Locked,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ForumThread {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Option<Uuid>,
    pub author_member_id: Uuid,
    pub title: String,
    pub body: String,
    pub status: ForumThreadStatus,
    pub pinned: bool,
    pub reply_count: i32,
    pub last_reply_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ForumReply {
    pub id: Uuid,
    pub thread_id: Uuid,
    pub author_member_id: Uuid,
    pub body: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_forum.rs`)

```rust
pub struct CommunityForumRepository { db: Arc<Database> }

impl CommunityForumRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn create_thread(&self, community_id: Uuid, author_member_id: Uuid, dto: CreateForumThreadDto) -> Result<ForumThreadWithAuthorDto>;
    pub async fn get_thread(&self, thread_id: Uuid) -> Result<Option<ForumThreadWithAuthorDto>>;
    pub async fn list_threads(&self, community_id: Uuid, tracked_category_id: Option<Uuid>, page: i64, page_size: i64) -> Result<Vec<ForumThreadWithAuthorDto>>;
    pub async fn set_thread_pinned(&self, thread_id: Uuid, pinned: bool) -> Result<ForumThreadWithAuthorDto>;
    pub async fn set_thread_status(&self, thread_id: Uuid, status: ForumThreadStatus) -> Result<ForumThreadWithAuthorDto>;
    pub async fn soft_delete_thread(&self, thread_id: Uuid) -> Result<()>;

    pub async fn create_reply(&self, thread_id: Uuid, author_member_id: Uuid, body: String) -> Result<ForumReplyWithAuthorDto>;
    pub async fn list_replies(&self, thread_id: Uuid, page: i64, page_size: i64) -> Result<Vec<ForumReplyWithAuthorDto>>;
    pub async fn get_reply(&self, reply_id: Uuid) -> Result<Option<ForumReplyWithAuthorDto>>;
    pub async fn soft_delete_reply(&self, reply_id: Uuid) -> Result<()>;

    // Bumps reply_count and last_reply_at on the parent thread; called inside
    // the same transaction as create_reply.
    async fn touch_thread_on_reply(&self, thread_id: Uuid, tx: &mut PgConnection) -> Result<()>;
}
```

`list_threads` orders by `pinned DESC, last_reply_at DESC NULLS LAST,
created_at DESC` to match the index. `ForumThreadWithAuthorDto` /
`ForumReplyWithAuthorDto` join `community_member` → `"user"` for
`author_username`/`author_avatar_url`, the same join shape as
`ReadFriendRequestDto::from_row` in `friends.rs`.

### Service (`backend/src/service/community_forum_service.rs`)

Permission rules, enforced in the service (repository stays query-only, per
convention):

- **Create thread**: actor must be a `community_member` of `community_id`
  (any role — owner/manager/member). If `tracked_category_id` is set, it
  must belong to the same community (reject with "This category does not
  belong to this community" otherwise).
- **Reply**: actor must be a member; thread `status` must be `open` — reject
  with "This thread is locked" if `locked`. Deleted threads (`deleted_at`
  not null) reject with "This thread no longer exists".
- **Pin/unpin, lock/unlock**: actor's `community_member.role` must be
  `manager` or `owner`. Reject with "Only managers and owners can pin
  threads" / "...lock threads" otherwise.
- **Delete thread**: allowed if actor role is `manager`/`owner`, OR
  (`actor_member_id == thread.author_member_id` AND
  `now() - thread.created_at < 5 minutes`). Otherwise: "You can only delete
  your own thread within 5 minutes of posting."
- **Delete reply**: allowed if actor role is `manager`/`owner`, OR
  `actor_member_id == reply.author_member_id` (no time limit on replies —
  authors always own their own replies).
- On successful reply creation: emit `community:forum_reply_added`
  notification to the thread author (skip if author replied to their own
  thread) via `NotificationService`, and insert a
  `community_activity_event` row with `event_type =
  'forum_thread_reply_added'`, `data = { thread_id, thread_title, reply_id
  }`.
- On successful thread creation: insert a `community_activity_event` row
  with `event_type = 'forum_thread_created'`.
- On pin: emit `community:forum_thread_pinned` notification to the thread
  author (not the pinning manager, unless they're the same person — skip
  self-notify).

### DTOs (`backend/src/service/community_forum_service.rs` or `dto/community_forum.rs`)

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateForumThreadDto {
    #[validate(length(min = 3, max = 150))]
    pub title: String,
    #[validate(length(min = 1, max = 5000))]
    pub body: String,
    pub tracked_category_id: Option<Uuid>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateForumReplyDto {
    pub thread_id: Uuid,
    #[validate(length(min = 1, max = 3000))]
    pub body: String,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateForumThreadStatusDto {
    pub thread_id: Uuid,
    pub locked: bool,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct SetForumThreadPinnedDto {
    pub thread_id: Uuid,
    pub pinned: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ListForumThreadsDto {
    pub tracked_category_id: Option<Uuid>,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ForumThreadWithAuthorDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Option<Uuid>,
    pub author: ReadUserDto,
    pub title: String,
    pub body: String,
    pub status: ForumThreadStatus,
    pub pinned: bool,
    pub reply_count: i32,
    pub last_reply_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ForumReplyWithAuthorDto {
    pub id: Uuid,
    pub thread_id: Uuid,
    pub author: ReadUserDto,
    pub body: String,
    pub created_at: DateTime<Local>,
}
```

### Router (`backend/src/router/community/forum.rs`, merged into `community_router()`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:id/forum/threads` | `list_threads_handler` | member of `:id` | Paginated thread list, optional `?tracked_category_id=` filter |
| POST | `/api/community/:id/forum/threads` | `create_thread_handler` | member of `:id` | Create a thread |
| GET | `/api/community/:id/forum/threads/:thread_id` | `get_thread_handler` | member of `:id` | Single thread |
| DELETE | `/api/community/:id/forum/threads/:thread_id` | `delete_thread_handler` | member (author within 5 min) or manager/owner | Soft-delete a thread |
| PATCH | `/api/community/:id/forum/threads/:thread_id/pin` | `set_thread_pinned_handler` | manager/owner | Pin/unpin |
| PATCH | `/api/community/:id/forum/threads/:thread_id/status` | `set_thread_status_handler` | manager/owner | Lock/unlock |
| GET | `/api/community/:id/forum/threads/:thread_id/replies` | `list_replies_handler` | member of `:id` | Paginated replies |
| POST | `/api/community/:id/forum/threads/:thread_id/replies` | `create_reply_handler` | member of `:id`, thread open | Create a reply |
| DELETE | `/api/community/:id/forum/replies/:reply_id` | `delete_reply_handler` | author or manager/owner | Soft-delete a reply |

Handler sketch for the primary endpoint:

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, community_id = %community_id))]
async fn create_thread_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateForumThreadDto>,
) -> ApiResponse<ForumThreadWithAuthorDto> {
    let result = state
        .community_forum_service
        .create_thread(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/communityForum.ts`)

```ts
// models/communityForum.ts
export const ForumThreadStatusSchema = z.enum(["open", "locked"]);

export const ForumThreadSchema = z.object({
  id: z.string().uuid(),
  community_id: z.string().uuid(),
  tracked_category_id: z.string().uuid().nullable(),
  author: ReadUserSchema,
  title: z.string().trim().min(3).max(150),
  body: z.string().trim().min(1).max(5000),
  status: ForumThreadStatusSchema,
  pinned: z.boolean(),
  reply_count: z.number().int(),
  last_reply_at: z.coerce.date<Date>().nullable(),
  created_at: z.coerce.date<Date>(),
});

export const ForumReplySchema = z.object({
  id: z.string().uuid(),
  thread_id: z.string().uuid(),
  author: ReadUserSchema,
  body: z.string().trim().min(1).max(3000),
  created_at: z.coerce.date<Date>(),
});

export type ForumThread = z.infer<typeof ForumThreadSchema>;
export type ForumReply = z.infer<typeof ForumReplySchema>;

// requests/communityForum.ts
const createThread = z.object({
  community_id: z.string().uuid(),
  title: z.string().trim().min(3, "Title needs at least 3 characters").max(150),
  body: z.string().trim().min(1, "Say something first").max(5000),
  tracked_category_id: z.string().uuid().optional(),
});

const createReply = z.object({
  thread_id: z.string().uuid(),
  body: z.string().trim().min(1, "Reply can't be empty").max(3000),
});

const setPinned = z.object({ thread_id: z.string().uuid(), pinned: z.boolean() });
const setLocked = z.object({ thread_id: z.string().uuid(), locked: z.boolean() });

export const CommunityForumRequestSchema = { createThread, createReply, setPinned, setLocked };
export type CommunityForumRequest = {
  [K in keyof typeof CommunityForumRequestSchema]: z.infer<(typeof CommunityForumRequestSchema)[K]>;
};
```

### API Client (`next-frontend/api/communityForumApi.ts`)

```ts
export const listThreads = async (communityId: string, params?: { tracked_category_id?: string; page?: number }) => { ... };
export const createThread = async (communityId: string, params: CommunityForumRequest["createThread"]) => { ... };
export const getThread = async (communityId: string, threadId: string) => { ... };
export const deleteThread = async (communityId: string, threadId: string) => { ... };
export const setThreadPinned = async (communityId: string, params: CommunityForumRequest["setPinned"]) => { ... };
export const setThreadLocked = async (communityId: string, params: CommunityForumRequest["setLocked"]) => { ... };
export const listReplies = async (communityId: string, threadId: string, page?: number) => { ... };
export const createReply = async (communityId: string, params: CommunityForumRequest["createReply"]) => { ... };
export const deleteReply = async (communityId: string, replyId: string) => { ... };
```

### React Query Hooks (`next-frontend/components/hooks/communityForum/`)

- `useForumThreads(communityId, filters)` — `useQuery`, `queryKeys.communities.forumThreads(communityId, filters)`.
- `useForumThread(communityId, threadId)` — `useQuery`, `queryKeys.communities.forumThread(threadId)`.
- `useForumReplies(communityId, threadId, page)` — `useQuery`, `queryKeys.communities.forumReplies(threadId, page)`.
- `useCreateForumThread(communityId)` — `useMutation`, invalidates `forumThreads(communityId)`, toast "Thread posted", navigates to the new thread.
- `useCreateForumReply(communityId, threadId)` — `useMutation` with **optimistic update**: appends a locally-constructed `ForumReply` (using the cached current user) to the `forumReplies` query cache immediately, rolls back on error.
- `useSetThreadPinned(communityId)` / `useSetThreadLocked(communityId)` — `useMutation`, optimistic toggle on the `forumThread`/`forumThreads` cache.
- `useDeleteForumThread(communityId)` / `useDeleteForumReply(communityId, threadId)` — `useMutation`, invalidate on success.

`queryKeys.communities` additions:

```ts
forumThreads: (communityId: string, filters?: { trackedCategoryId?: string }) => ({
  queryKey: [communityId, "forum-threads", filters ?? {}],
  queryFn: async () => await CommunityForumApi.listThreads(communityId, { tracked_category_id: filters?.trackedCategoryId }),
}),
forumThread: (threadId: string) => ({
  queryKey: [threadId, "forum-thread"],
  queryFn: async () => await CommunityForumApi.getThread(threadId),
}),
forumReplies: (threadId: string, page: number) => ({
  queryKey: [threadId, "forum-replies", page],
  queryFn: async () => await CommunityForumApi.listReplies(threadId, page),
}),
```

### UI Components (`next-frontend/components/community/forum/`)

- `ForumThreadList.tsx` — paginated list, pinned threads pinned-icon + separated visually, category filter chip row.
- `ForumThreadListItem.tsx` — title, author avatar, reply count, "last activity" relative time, locked/pinned badges.
- `NewForumThreadDialog.tsx` — title + body form (Zod-validated), optional tracked-category select.
- `ForumThreadDetail.tsx` — thread header (title, body, author, pin/lock controls for managers) + `ForumReplyList`.
- `ForumReplyList.tsx` — paginated reply list, "load more" at bottom.
- `ForumReplyItem.tsx` — author, timestamp, rendered body, delete button (own reply/manager).
- `NewForumReplyForm.tsx` — textarea + submit, disabled with explanatory text when thread is locked.
- `MarkdownLiteBody.tsx` — renders `**bold**`, `*italic*`, line breaks, and auto-links bare URLs; a small regex-based renderer, not an npm dependency, since no markdown renderer exists in the frontend today.
- `ForumThreadStatusBadge.tsx` — pinned/locked indicator, icon + text (not color-only, see Accessibility).

Primary user journey — posting a reply:

1. Member opens a community, clicks **Forum** tab → `ForumThreadList` loads (skeleton while `useForumThreads` is pending).
2. Member clicks a thread → navigates to `/communities/[id]/forum/[threadId]`, `ForumThreadDetail` renders the thread body via `MarkdownLiteBody` and `ForumReplyList` loads replies.
3. Member types into `NewForumReplyForm` and clicks **Reply**. `useCreateForumReply` optimistically appends the reply to the list and clears the textarea immediately.
4. On server success, the optimistic entry is reconciled with the real `id`/`created_at`. On failure, the optimistic entry is removed, the textarea content is restored, and a toast fires.
5. If the thread author is someone else, they get a `community:forum_reply_added` notification, visible in their notification bell.

## UX & Polish

- **Loading state**: `ForumThreadList` renders 5 skeleton rows (title bar + meta line) instead of a spinner; `ForumThreadDetail` renders a skeleton title/body block plus 3 skeleton reply rows.
- **Empty state** (no threads yet): centered illustration-style icon (speech bubble), heading "No discussions yet", body "Be the first to start a conversation in this community." and a primary **Start a thread** button.
- **Empty state** (thread with no replies): "No replies yet — be the first to respond." shown above the reply form.
- **Error states** (toast copy):
  - Posting a reply fails: title "Couldn't post your reply", description "Something went wrong sending your reply. Your text is still in the box — try again."
  - Creating a thread fails validation server-side: title "Couldn't create thread", description the server message (e.g. "This category does not belong to this community").
  - Pin/lock fails (e.g. race where the actor's role just changed): title "Couldn't update thread", description "You may no longer have permission to do this — refresh and try again."
- **Optimistic updates**: reply posting (see above) and pin/lock toggling both update the UI immediately with rollback on error; thread creation is **not** optimistic (navigates only after the server confirms, since it needs the real thread id for routing).
- **Responsive (mobile)**: `ForumThreadList` collapses the meta line (author, reply count, last activity) to a single small-text row under the title instead of three columns; the tracked-category filter row becomes a horizontally-scrollable chip strip; `ForumThreadDetail`'s reply form sticks to the bottom of the viewport above the mobile nav bar rather than requiring scroll-to-bottom.
- **Accessibility**: `NewForumThreadDialog` traps focus and returns focus to the triggering button on close; the title input receives initial focus; pin/lock buttons use `aria-pressed`; locked/pinned state is conveyed with both an icon and text label ("Locked", "Pinned"), never color alone; reply list uses `<article>` per reply with an `aria-label` combining author and relative time for screen readers; "load more" replies is a real button (keyboard-operable), not a scroll-triggered fetch only.

## Acceptance Criteria

- [ ] A member can create a general thread and a tracked-category thread.
- [ ] A non-member cannot view or post to a community's forum (403-equivalent `ApiResponse::Error`).
- [ ] A member can reply to an open thread; reply count and last-reply time update on the thread list without a manual refresh.
- [ ] A member cannot reply to a locked thread; the UI disables the form and explains why.
- [ ] Only manager/owner can pin or lock a thread; a `member`-role actor attempting this gets a clear error and the UI never shows the controls to them in the first place.
- [ ] A thread author can delete their own thread within 5 minutes of posting; the delete option becomes disabled (not hidden, with a tooltip explaining why) after that window client-side, and the server independently enforces the same rule.
- [ ] A reply author can delete their own reply at any time; a manager/owner can delete any reply.
- [ ] Deleting a thread/reply soft-deletes it (`deleted_at` set) — it disappears from listings but the row remains for audit purposes.
- [ ] The thread author receives a `community:forum_reply_added` notification when someone else replies, and not when they reply to their own thread.
- [ ] Creating a thread and posting a reply each insert a `community_activity_event` row.

## Testing Notes

- Backend (`cargo test`, in `community_forum_service` tests):
  - `member_can_create_general_thread` — asserts thread created with `tracked_category_id = None`.
  - `member_can_create_category_thread_for_own_community_category` — asserts success.
  - `create_thread_rejects_tracked_category_from_other_community` — asserts `Err` with message containing "does not belong to this community".
  - `non_member_cannot_create_thread` — asserts `Err`.
  - `reply_rejected_when_thread_locked` — asserts `Err` with "locked" in the message.
  - `only_manager_or_owner_can_pin_thread` — table-test over `owner`/`manager`/`member` roles, asserting success for the first two and `Err` for `member`.
  - `author_can_delete_own_thread_within_five_minutes` — freezes/mocks `created_at` to 4 minutes ago, asserts success; a second case at 6 minutes ago asserts `Err`.
  - `manager_can_delete_any_thread_regardless_of_age` — asserts success at 1 hour old.
  - `reply_author_can_always_delete_own_reply` — asserts success at 1 day old.
  - `reply_notifies_thread_author_but_not_self_reply` — asserts `NotificationService::notify_*` called once for a third-party reply and zero times when author replies to their own thread (mock/spy on the notification service).
- Frontend (Storybook stories under `next-frontend/stories/community/forum/`):
  - `ForumThreadList.stories.tsx` — Default (populated), Empty, Loading, WithPinnedThread.
  - `ForumThreadDetail.stories.tsx` — OpenThread, LockedThread (form disabled), ManagerView (pin/lock controls visible), MemberView (controls hidden).
  - `NewForumThreadDialog.stories.tsx` — Default, ValidationErrors (title too short, body empty).
  - `ForumReplyList.stories.tsx` — Default, Empty, LoadMorePending.
  - `MarkdownLiteBody.stories.tsx` — PlainText, BoldItalic, AutoLinkedUrl, MultiLine.
