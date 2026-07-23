# Step 5: Community Activity Feed

## Overview

A reverse-chronological feed of system-generated events for a community:
members joining, badges being awarded, and streak milestones being hit.
This is the step that makes steps 1 and 2's work visible as a shared,
social artifact rather than something only the individual member sees on
their own profile — build 1–2 before this step, since without them there
are only "member joined" events to show. No user-authored posts here
(that's forums, v4) — every row is written by a backend service, never
directly by a client request.

## Scope

- In scope:
  - `community_activity_event`: append-only log of `member_joined`,
    `badge_awarded`, `streak_milestone` events.
  - Writers: v1's join-community flow (extended to also write an event),
    step 1's badge-award path, step 2's streak-milestone path.
  - Paginated feed endpoint + infinite-scroll feed UI on the community
    dashboard.
  - `data_visibility` enforcement identical to the rest of the dashboard —
    a `members_only` community's feed is members-only too.
- Explicitly deferred:
  - **User-authored posts/comments on feed items** — that's forums (v4);
    this feed is read-only, system-generated, no reply/react affordance.
  - **Per-member feed filtering** ("show only my events") — the feed is a
    single community-wide stream in v3; a personal filter view is a small
    enough addition to defer without blocking anything else.
  - **Feed event deletion/moderation** — no admin tooling to hide/remove
    feed entries yet; that class of tooling is explicitly v4
    ("automated moderation").
  - **Real-time push (websocket) delivery** — the feed refetches on an
    interval (see React Query Hooks) like the existing notification
    stream does, not a live socket. Matches the codebase's current
    real-time approach everywhere else (polling, not websockets).

## Data Model

### Migration: `backend/migrations/0073_create_community_activity_event.sql`

```sql
CREATE TYPE community_activity_event_type AS ENUM (
    'member_joined',
    'badge_awarded',
    'streak_milestone'
);

CREATE TABLE community_activity_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    -- The member the event is about. Nullable + ON DELETE SET NULL rather
    -- than CASCADE: if a member later leaves the community (v1's leave
    -- flow deletes their community_member row), their past "joined the
    -- community" and badge/streak events should stay in the feed as
    -- history, just no longer resolvable to a live member row.
    community_member_id UUID REFERENCES community_member(id) ON DELETE SET NULL,
    event_type community_activity_event_type NOT NULL,
    -- Denormalized at write time so the feed never needs to join back to
    -- a possibly-deleted community_member/user row to render old events:
    -- username/avatar as of the moment the event happened.
    actor_username TEXT NOT NULL,
    actor_avatar_url TEXT,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_activity_event_community_created
    ON community_activity_event (community_id, created_at DESC);
```

`payload` shape per `event_type` (documented here since it's not its own
column-per-field — matches the existing `notification.content JSONB`
precedent from `backend/migrations/0026_create_notification_table.sql`):

| `event_type` | `payload` shape |
|---|---|
| `member_joined` | `{}` (nothing beyond the denormalized actor fields) |
| `badge_awarded` | `{ "badge_code": "first_10_hours", "badge_name": "First 10 Hours", "badge_tier": "bronze", "badge_icon": "Clock" }` |
| `streak_milestone` | `{ "streak_days": 30 }` |

### Rust entity (`backend/src/entity/community_activity_event.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_activity_event_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityActivityEventType {
    MemberJoined,
    BadgeAwarded,
    StreakMilestone,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommunityActivityEvent {
    pub id: Uuid,
    pub community_id: Uuid,
    pub community_member_id: Option<Uuid>,
    pub event_type: CommunityActivityEventType,
    pub actor_username: String,
    pub actor_avatar_url: Option<String>,
    pub payload: Value,
    pub created_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_activity_event.rs`)

```rust
pub struct CommunityActivityEventRepository { db: Arc<Database> }

impl CommunityActivityEventRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn create(&self, dto: CreateActivityEventDto) -> Result<CommunityActivityEvent>;

    /// Cursor-paginated (created_at, id) descending, matching the
    /// notification repository's cursor style
    /// (`NotificationQueryDto { cursor, limit, .. }`).
    pub async fn list_for_community(
        &self,
        community_id: Uuid,
        cursor: Option<DateTime<Local>>,
        limit: i64,
    ) -> Result<Vec<CommunityActivityEvent>>;
}
```

```sql
-- list_for_community
SELECT id, community_id, community_member_id, event_type,
       actor_username, actor_avatar_url, payload, created_at
FROM community_activity_event
WHERE community_id = $1
  AND ($2::timestamptz IS NULL OR created_at < $2)
ORDER BY created_at DESC
LIMIT $3;
```

### Service (`backend/src/service/community_activity_event_service.rs`)

**What triggers a write** — three call sites, one per event type, each
called from the service that owns the underlying fact rather than the
feed reaching out to poll for changes:

1. `member_joined` — called from v1's community-join service method
   (`CommunityMembershipService::join`, established in
   `v1-mvp-core/02-membership-join-leave-invite-code.md`) immediately after
   the `community_member` row is inserted. This is the one integration
   point in an *earlier* version's file this step's implementer needs to
   go back and add — call it out explicitly in the join method's diff, one
   line: `self.activity_event_service.record_member_joined(&member).await;`
   after the insert commits (fire-and-forget, must not fail the join if
   the event write fails — logged, not propagated).
2. `badge_awarded` — called from step 1's
   `CommunityBadgeService::evaluate_member_badges`, once per newly-awarded
   badge, already shown in that step's service sketch.
3. `streak_milestone` — called from step 2's
   `CommunityStreakService::recompute_after_session_completed`, once per
   milestone crossing, already shown in that step's service sketch.

```rust
#[derive(Clone)]
pub struct CommunityActivityEventService {
    repo: CommunityActivityEventRepository,
}

impl CommunityActivityEventService {
    #[instrument(err, skip(self), fields(community_member_id = %member.id))]
    pub async fn record_member_joined(&self, member: &ReadCommunityMemberDto) -> Result<()> {
        self.repo.create(CreateActivityEventDto {
            community_id: member.community_id,
            community_member_id: Some(member.id),
            event_type: CommunityActivityEventType::MemberJoined,
            actor_username: member.user.username.clone(),
            actor_avatar_url: member.user.avatar_url.clone(),
            payload: serde_json::json!({}),
        }).await?;
        Ok(())
    }

    #[instrument(err, skip(self, badge), fields(community_member_id = %community_member_id, badge_code = %badge.code))]
    pub async fn record_badge_awarded(
        &self,
        community_member_id: Uuid,
        badge: &CommunityBadge,
        awarded_at: DateTime<Local>,
    ) -> Result<()> {
        // actor_username/avatar looked up once here via a lightweight
        // member+user join, kept out of the hot award-evaluation path.
        let member = self.repo.get_member_actor_fields(community_member_id).await?;
        self.repo.create(CreateActivityEventDto {
            community_id: member.community_id,
            community_member_id: Some(community_member_id),
            event_type: CommunityActivityEventType::BadgeAwarded,
            actor_username: member.username,
            actor_avatar_url: member.avatar_url,
            payload: serde_json::json!({
                "badge_code": badge.code,
                "badge_name": badge.name,
                "badge_tier": badge.tier,
                "badge_icon": badge.icon,
            }),
        }).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(community_member_id = %community_member_id, streak_days = streak_days))]
    pub async fn record_streak_milestone(
        &self,
        community_member_id: Uuid,
        streak_days: i32,
    ) -> Result<()> {
        let member = self.repo.get_member_actor_fields(community_member_id).await?;
        self.repo.create(CreateActivityEventDto {
            community_id: member.community_id,
            community_member_id: Some(community_member_id),
            event_type: CommunityActivityEventType::StreakMilestone,
            actor_username: member.username,
            actor_avatar_url: member.avatar_url,
            payload: serde_json::json!({ "streak_days": streak_days }),
        }).await?;
        Ok(())
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor_id = %actor))]
    pub async fn list_feed(
        &self,
        actor: &Actor,
        community_id: Uuid,
        query: ActivityFeedQueryDto,
    ) -> Result<Vec<ReadActivityEventDto>> {
        // reuses the same data_visibility check every other v3 endpoint
        // does; deliberately not re-described here since it's identical.
        self.community_service.assert_can_view_dashboard(actor, community_id).await?;
        let events = self.repo.list_for_community(community_id, query.cursor, query.limit.unwrap_or(20)).await?;
        Ok(events.into_iter().map(Into::into).collect())
    }
}
```

### DTOs (`backend/src/dto/community_activity_event.rs`)

```rust
#[derive(Clone, Serialize, Deserialize)]
pub struct ReadActivityEventDto {
    pub id: Uuid,
    pub community_member_id: Option<Uuid>,
    #[serde(flatten)]
    pub event_type: CommunityActivityEventType,
    pub actor_username: String,
    pub actor_avatar_url: Option<String>,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct ActivityFeedQueryDto {
    pub cursor: Option<DateTime<Local>>,
    #[validate(range(min = 1, max = 50))]
    pub limit: Option<i64>,
}

pub struct CreateActivityEventDto {
    pub community_id: Uuid,
    pub community_member_id: Option<Uuid>,
    pub event_type: CommunityActivityEventType,
    pub actor_username: String,
    pub actor_avatar_url: Option<String>,
    pub payload: serde_json::Value,
}
```

### Router

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:community_id/activity` | `list_activity_feed_handler` | member of community, or public data | Cursor-paginated activity feed, newest first. |

```rust
#[instrument(skip(state), fields(community_id = %community_id, actor_id = %actor))]
async fn list_activity_feed_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    Query(query): Query<ActivityFeedQueryDto>,
    actor: Actor,
) -> ApiResponse<Vec<ReadActivityEventDto>> {
    let result = state
        .community_activity_event_service
        .list_feed(&actor, community_id, query)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`api/definitions/models/community-activity.ts`)

```ts
export const ActivityEventTypeSchema = z.enum([
  "member_joined",
  "badge_awarded",
  "streak_milestone",
]);

const BadgeAwardedPayloadSchema = z.object({
  badgeCode: z.string(),
  badgeName: z.string(),
  badgeTier: CommunityBadgeTierSchema,
  badgeIcon: z.string(),
});

const StreakMilestonePayloadSchema = z.object({
  streakDays: z.number().int(),
});

export const ActivityEventSchema = z.object({
  id: z.string().uuid(),
  communityMemberId: z.string().uuid().nullable(),
  eventType: ActivityEventTypeSchema,
  actorUsername: z.string(),
  actorAvatarUrl: z.string().nullable(),
  payload: z.union([
    BadgeAwardedPayloadSchema,
    StreakMilestonePayloadSchema,
    z.object({}),
  ]),
  createdAt: z.coerce.date<Date>(),
});

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
```

### API Client (`api/communityActivityApi.ts`)

```ts
export const listFeed = async (params: CommunityActivityRequest["listFeed"]) => {
  const { data } = await baseApi.get(`/community/${params.communityId}/activity`, {
    params: { cursor: params.cursor, limit: params.limit ?? 20 },
  });
  return await parseResponseUnsafe(data, CommunityActivityResponseSchema.listFeed);
};
```

### React Query Hooks (`components/hooks/community/useCommunityActivityFeed.ts`)

- `useCommunityActivityFeed(communityId: string)` — `useInfiniteQuery`
  (first infinite-query usage introduced in the community feature set;
  `getNextPageParam` reads the last item's `createdAt` as the next
  cursor), `refetchInterval: 60_000` to catch new events without a
  websocket, matching `useUnseenNotifications`'s polling interval exactly.

`queryKeys.ts` addition:

```ts
const communityActivityKeys = createQueryKeys("communityActivity", {
  feed: (communityId: string) => ({
    queryFn: async ({ pageParam }: { pageParam?: string; }) =>
      await CommunityActivityApi.listFeed({ communityId, cursor: pageParam }),
    queryKey: [communityId, "feed"],
  }),
});
```

### UI Components

- `components/community/activity/ActivityFeed.tsx` — the scroll container,
  `useInfiniteQuery` + intersection-observer "load more" trigger at the
  bottom (matches whatever infinite-scroll idiom the existing feed feature
  under `components/hooks/feed/useFeed.ts` / `next-frontend/api/feedApi.ts`
  already uses for the personal social feed — reuse that idiom rather than
  inventing a second one).
- `components/community/activity/ActivityFeedItem.tsx` — dispatches on
  `eventType` to one of three inline renderers (no separate files needed,
  these are three small `<div>` branches, not full components — unlike
  step 1's per-notification-type components, since this feed has only
  three types and each is a one-liner):
  - `member_joined`: avatar + *"{username} joined the community"*
  - `badge_awarded`: badge icon (tier-colored) + *"{username} earned
    {badgeName}"*
  - `streak_milestone`: flame icon + *"{username} hit a {streakDays}-day
    streak"*
- `components/community/activity/ActivityFeedSkeleton.tsx` — loading
  placeholder rows.

User journey:
1. Community dashboard (v1) gains an "Activity" section/tab showing
   `ActivityFeed`.
2. Feed loads the newest 20 events; scrolling near the bottom triggers the
   next page via the infinite query.
3. Every 60 seconds, the feed's first page silently refetches in the
   background; if new events arrived, a small non-intrusive "N new" pill
   appears at the top of the feed (clicking it scrolls up and prepends the
   new items) rather than the list jumping/reordering under the member's
   cursor while they're mid-scroll.

## UX & Polish

- **Loading state**: `ActivityFeedSkeleton` — 5 rows of
  avatar-circle + two text-line placeholders, matching the real item's
  visual weight so the transition from skeleton to real content doesn't
  cause a height jump.
- **Empty state**: brand-new community with only the creator as a member:
  *"No activity yet — this feed will fill up as people join and hit
  milestones."*
- **Error state**: toast — title `"Couldn't load activity feed"`,
  description `"Something went wrong loading recent activity. Pull to
  refresh or try again shortly."`, `variant: "destructive"`. A failed
  "load more" (pagination) shows an inline retry row at the bottom of the
  list instead of a toast, since it's a partial failure, not a full-page
  one.
- **Optimistic/real-time feel**: the feed itself isn't a place the member
  *acts* (read-only), so no optimistic mutation applies here — the
  "feels alive" affordance is the 60s background refetch + "N new" pill
  described above, giving a lightweight sense of a living feed without
  websockets.
- **Responsive**: single-column list at all widths (this component was
  never a grid/chart, so there's no desktop-only layout to collapse) —
  the only mobile-specific change is avatar size stepping down slightly
  and timestamp moving from an inline suffix to a second line under the
  event text, to avoid line-wrapping mid-sentence on narrow screens.
- **Accessibility**: `ActivityFeed`'s scroll container is
  `role="feed"` with `aria-busy` toggled true while a page is loading;
  each `ActivityFeedItem` is `role="article"` with an
  `aria-label` summarizing the full sentence (so screen reader users get
  "badge icon" context via the label text, not by inferring it from an
  icon alone). The "N new" pill is `role="status"` (`aria-live="polite"`)
  so its appearance is announced without stealing focus.

## Acceptance Criteria

- [ ] Joining a community (v1 flow) produces exactly one `member_joined`
      activity event.
- [ ] Every badge awarded in step 1 and every streak milestone crossed in
      step 2 produces exactly one corresponding activity event, in the
      same request that caused the award/milestone.
- [ ] The feed endpoint paginates correctly by `created_at` cursor with no
      duplicate or skipped events across page boundaries when new events
      are inserted between page fetches.
- [ ] A member who leaves the community still has their historical
      `member_joined`/`badge_awarded`/`streak_milestone` events visible in
      the feed (via denormalized `actor_username`), with
      `community_member_id` become `NULL` rather than the rows being
      deleted.
- [ ] Feed respects `data_visibility` identically to the dashboard.
- [ ] The "N new" pill appears on background refetch without reordering
      the list under an actively-scrolling user.

## Testing Notes

- Backend (`cargo test`):
  - `record_member_joined_creates_one_event`
  - `record_badge_awarded_denormalizes_actor_fields_at_write_time`
  - `list_feed_cursor_pagination_no_duplicates_across_pages`
  - `list_feed_respects_data_visibility_members_only`
  - `community_activity_event_survives_member_leaving` (delete the
    `community_member` row, assert the event row persists with
    `community_member_id = NULL` and `actor_username` unchanged).
- Frontend (Storybook):
  - `ActivityFeedItem.stories.tsx`: one story per `eventType` (three), plus
    a long-username truncation case.
  - `ActivityFeed.stories.tsx`: populated multi-page (mock
    `useInfiniteQuery` pages), empty state, loading skeleton, "N new" pill
    visible state.
