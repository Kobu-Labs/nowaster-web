# Step 4: Leaderboard

## Overview

The first taste of competition: a ranked member list by tracked time
within a community, with a period selector (day/week/month/all-time). No
badges, streaks, or historical trend lines — that's v3's job. This is a
read-only view built on the exact aggregation path v1's dashboard already
established (`community_category_mapping` joining a member's personal
`session` rows), just grouped per-member and time-boxed instead of
summed community-wide. It depends on Step 1 for nothing functionally (the
leaderboard is visible to any member, role has no bearing on ranking) but
reuses the same `data_visibility` permission check v1's dashboard uses, so
conceptually it slots in as a sibling of that dashboard.

## Scope

- In scope:
  - `GET /api/community/{id}/leaderboard?period=day|week|month|all_time`
    — ranked members by total mapped-session minutes in that period
  - Rank ties share the same rank (standard competition ranking: two
    people tied at #1 means the next distinct total is #3, not #2)
  - If the requesting member isn't in the visible top slice, their own
    rank is still returned separately so the UI can show "You're #47 of
    132" without paginating the whole list
  - Respects v1's `community.data_visibility` exactly the way the
    dashboard does: `members_only` requires the actor be a member,
    `public` is viewable by anyone
  - Leaderboard UI: period tabs, ranked list with avatar/username/total
    time, current-user row highlighted, top-3 visual distinction that
    doesn't rely on color alone
- Explicitly deferred:
  - Badges, streaks, any achievement layer attached to rank (→ v3)
  - Historical leaderboard snapshots ("you were #3 last week") (→ v3,
    alongside the activity feed / analytics)
  - Per-tracked-category leaderboards (only a whole-community leaderboard
    ships in v2; category-level breakdowns are dashboard territory,
    unchanged from v1) (→ not currently planned)
  - Caching/materializing rankings — computed at query time, same stance
    v1 took and Step 3 took for the activity sort (→ revisit only if
    real usage shows it's needed)

## Data Model

### Inherited from v1 (read-only reference)

```sql
CREATE TABLE community_category_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    personal_category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    tracked_category_id UUID NOT NULL REFERENCES community_tracked_category(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, personal_category_id, tracked_category_id)
);
```

`session(id, user_id, category_id, start_time, end_time, ...)` is the
existing per-user session table, unmodified since long before communities
existed.

### Migration: `backend/migrations/0064_add_community_leaderboard_indexes.sql`

No new tables — the leaderboard is a query over existing v1 tables. This
migration only adds the indexes that make period-filtered, per-member
grouping fast, guarded with `IF NOT EXISTS` in case v1's own aggregation
step already added an overlapping one.

```sql
-- 0064_add_community_leaderboard_indexes.sql

-- Speeds the join from a community's mappings to a member's sessions,
-- filtered by a start_time window and grouped by user.
CREATE INDEX IF NOT EXISTS idx_session_user_category_start_time
    ON session(user_id, category_id, start_time);

-- Speeds "all mappings for this community" lookups, which both the v1
-- dashboard and this leaderboard query start from.
CREATE INDEX IF NOT EXISTS idx_community_category_mapping_community_user
    ON community_category_mapping(community_id, user_id);
```

### Rust entity changes

None — no new entity, this step is DTO + query only.

## Backend Implementation

### Repository (`backend/src/repository/community/leaderboard.rs`, new file)

| Function | Purpose |
|---|---|
| `get_leaderboard(&self, community_id: Uuid, period: LeaderboardPeriod, actor_id: &str) -> Result<Vec<LeaderboardRow>>` | Runs the ranked, period-windowed aggregation; the row for `actor_id` is always included even if outside the returned top slice, flagged via `is_actor` |

```rust
#[instrument(err, skip(self), fields(community_id = %community_id, period = ?period))]
pub async fn get_leaderboard(
    &self,
    community_id: Uuid,
    period: LeaderboardPeriod,
    actor_id: &str,
) -> Result<Vec<LeaderboardRow>> {
    let window_start = period.window_start(); // None for AllTime

    let rows = crate::named_query!(
        "community_leaderboard",
        sqlx::query(
            r#"
            WITH member_minutes AS (
                SELECT
                    ccm.user_id,
                    COALESCE(SUM(
                        EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60
                    ), 0)::bigint AS total_minutes
                FROM community_member m
                LEFT JOIN community_category_mapping ccm
                    ON ccm.community_id = m.community_id AND ccm.user_id = m.user_id
                LEFT JOIN session s
                    ON s.category_id = ccm.personal_category_id
                    AND s.user_id = ccm.user_id
                    AND ($2::timestamptz IS NULL OR s.start_time >= $2)
                WHERE m.community_id = $1
                GROUP BY ccm.user_id, m.user_id
            ),
            ranked AS (
                SELECT
                    user_id,
                    total_minutes,
                    RANK() OVER (ORDER BY total_minutes DESC) AS rank
                FROM member_minutes
            )
            SELECT
                r.rank, r.user_id, r.total_minutes,
                u.displayname AS username, u.avatar_url,
                (r.user_id = $3) AS is_actor
            FROM ranked r
            JOIN "user" u ON u.id = r.user_id
            ORDER BY r.rank ASC, u.displayname ASC
            "#,
        )
        .bind(community_id)
        .bind(window_start)
        .bind(actor_id)
        .fetch_all(self.db.get_pool())
    )?;

    // map rows into Vec<LeaderboardRow> ...
}
```

Note the `LEFT JOIN` chain from `community_member` (not
`community_category_mapping`): every member appears in the ranking even
if they haven't mapped a category yet, with `total_minutes = 0`, rather
than silently disappearing — an unmapped new member should see themselves
at the bottom, not be confused about why they're missing entirely.

### Service (`backend/src/service/community_leaderboard_service.rs`, new service — a genuine new sub-resource per the README's convention, since it's read-only and doesn't share state with `community_service`'s CRUD)

Permission rule, stated exactly: mirrors v1's dashboard check —

- `community.data_visibility == 'members_only'`: actor must have a
  `community_member` row for this community, or the request fails with
  `"This community's data is only visible to members"`.
- `community.data_visibility == 'public'`: any authenticated user may
  view.
- Archived communities (`archived_at IS NOT NULL`) return the same
  `"Community not found"` a deleted/nonexistent id would, matching v1's
  archive-hides-from-non-members behavior.

```rust
#[derive(Clone, Default, Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum LeaderboardPeriod {
    Day,
    Week,
    Month,
    #[default]
    AllTime,
}

impl LeaderboardPeriod {
    pub fn window_start(&self) -> Option<DateTime<Local>> {
        let now = Local::now();
        match self {
            LeaderboardPeriod::Day => Some(now - Duration::days(1)),
            LeaderboardPeriod::Week => Some(now - Duration::weeks(1)),
            LeaderboardPeriod::Month => Some(now - Duration::days(30)),
            LeaderboardPeriod::AllTime => None,
        }
    }
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct GetLeaderboardDto {
    #[serde(default)]
    pub period: LeaderboardPeriod,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct LeaderboardEntryDto {
    pub rank: i64,
    pub user: ReadUserDto,
    pub total_minutes: i64,
    pub is_actor: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct LeaderboardDto {
    pub period: LeaderboardPeriod,
    pub entries: Vec<LeaderboardEntryDto>,
    pub actor_entry: Option<LeaderboardEntryDto>,
    pub total_members: i64,
}
```

`get_leaderboard` returns the full ranked list; the service caps the
`entries` field it hands back to the top 20 (configurable) and separately
surfaces `actor_entry` — the actor's own row, always present regardless
of whether they made the top 20 — so the frontend never has to guess.

Error cases:

- `"Community not found"` — bad id or archived
- `"This community's data is only visible to members"` — `members_only`
  community, non-member actor

### DTOs

(Shown above.) `LeaderboardPeriod` uses `#[serde(rename_all =
"snake_case")]` (not `lowercase` like `CommunityRole`) since `AllTime`
needs to serialize as `all_time`, matching how other multi-word variants
in this codebase are handled.

### Router (`backend/src/router/community/leaderboard.rs`, new file)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/{community_id}/leaderboard` | `get_leaderboard_handler` | Actor, permission per `data_visibility` | Ranked member list for a period |

```rust
use axum::{
    extract::{Path, Query, State},
    routing::get,
    Router,
};
use uuid::Uuid;

use crate::{
    router::{clerk::Actor, response::ApiResponse, root::AppState},
    service::community_leaderboard_service::GetLeaderboardDto,
};

pub fn community_leaderboard_router() -> Router<AppState> {
    Router::new().route("/{community_id}/leaderboard", get(get_leaderboard_handler))
}

#[instrument(skip(state), fields(community_id = %community_id, user_id = %actor, period = ?payload.period))]
async fn get_leaderboard_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    Query(payload): Query<GetLeaderboardDto>,
    actor: Actor,
) -> ApiResponse<LeaderboardDto> {
    let result = state
        .community_leaderboard_service
        .get_leaderboard(community_id, payload.period, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas

`next-frontend/api/definitions/models/community-leaderboard.ts`:

```ts
export const LeaderboardPeriodSchema = z.enum(["day", "week", "month", "all_time"]);
export type LeaderboardPeriod = z.infer<typeof LeaderboardPeriodSchema>;

export const LeaderboardEntrySchema = z.object({
  rank: z.number().int(),
  user: UserSchema,
  totalMinutes: z.number().int(),
  isActor: z.boolean(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const LeaderboardSchema = z.object({
  period: LeaderboardPeriodSchema,
  entries: z.array(LeaderboardEntrySchema),
  actorEntry: LeaderboardEntrySchema.nullable(),
  totalMembers: z.number().int(),
});
export type Leaderboard = z.infer<typeof LeaderboardSchema>;
```

### API Client (`next-frontend/api/communityLeaderboard.ts`, new file)

```ts
export const getLeaderboard = async (
  communityId: string,
  period: LeaderboardPeriod = "all_time",
) => {
  const { data } = await baseApi.get(
    `/community/${communityId}/leaderboard`,
    { params: { period } },
  );
  return await parseResponseUnsafe(data, LeaderboardSchema);
};
```

### React Query Hooks

- `useCommunityLeaderboard(communityId: string, period: LeaderboardPeriod)`
  — `useQuery`, `staleTime: 60_000` (a minute of staleness is fine for a
  ranking; no need to hammer the endpoint), `keepPreviousData: true` so
  switching period tabs doesn't blank the list

`queryKeys.communities.*` addition:

```ts
const communityKeys = createQueryKeys("communities", {
  // ...members, capabilities, invites, inbox, discover from Steps 1-3
  leaderboard: (communityId: string, period: LeaderboardPeriod) => ({
    queryFn: async () =>
      await CommunityLeaderboardApi.getLeaderboard(communityId, period),
    queryKey: [communityId, "leaderboard", period],
  }),
});
```

No mutations in this step — the leaderboard is read-only. The only
interactive state is the period tab selection, held in local component
state and reflected straight into the `useCommunityLeaderboard` query key,
so switching tabs triggers a normal (non-optimistic) refetch. There's
nothing to optimistically update since ranks are a server-computed
aggregate, not a value the user directly edits — no rollback semantics
apply here.

### UI Components

- `components/visualizers/communities/Leaderboard.tsx` — period tabs
  (`shadcn/tabs`: Day / Week / Month / All-time) + `LeaderboardList`
- `components/visualizers/communities/LeaderboardList.tsx` — ranked rows,
  renders `entries`, then a visual divider, then `actorEntry` pinned at
  the bottom if it's not already within `entries`
- `components/visualizers/communities/LeaderboardRow.tsx` — rank number
  (always rendered as text, e.g. "#1"), top-3 get a small trophy/medal
  icon *in addition to* the number (never instead of), avatar, username,
  formatted duration (`2h 15m`), current-user row gets a distinct
  background + a "You" pill

Primary flow — viewing and filtering the leaderboard:

1. Member opens a community's **Leaderboard** tab (sibling to v1's
   Dashboard tab). `Leaderboard` mounts with `period = "week"` as the
   default (a more engaging default than "all_time" for a returning
   user, and cheaper to compute than an unbounded scan).
2. `useCommunityLeaderboard(communityId, "week")` fires;
   `LeaderboardList` renders once resolved, top 20 ranked rows plus the
   actor's own row pinned below a divider if they're outside the top 20.
3. Member taps the "Month" tab. Local state updates `period`;
   `keepPreviousData` keeps last week's ranking visible (slightly dimmed)
   while the month query resolves, avoiding a jarring blank state.
4. Member sees their own row highlighted with a "You" pill regardless of
   which section of the list it's in, so they don't have to scan for
   their username.
5. Member taps "All-time" — same pattern, potentially a slower query on
   a very active community, so this tab shows a brief skeleton
   overlay if the fetch takes over ~400ms rather than leaving stale data
   up indefinitely.

## UX & Polish

- **Loading state**: initial load shows 8 skeleton rows at
  `LeaderboardRow` height (avatar circle + two text bars); period-switch
  loads use `keepPreviousData` and only show a skeleton if the fetch
  exceeds ~400ms (avoids skeleton flicker on fast responses).
- **Empty state**: a community with members but zero mapped time in the
  selected period: "No time logged {period label} yet. Once members map
  a category and start a session, they'll show up here." with a
  secondary link to the category-mapping flow (v1) if the *viewing* user
  hasn't mapped a category themselves yet.
- **Error states** (toast/inline copy):
  - Leaderboard fetch fails: inline error card in place of the list —
    "Couldn't load the leaderboard. Try again." with a Retry button
    (primary content failure, not a toast).
  - `members_only` permission failure for a non-member: not an error
    state at all — the Leaderboard tab itself is hidden/disabled for
    non-members of a `members_only` community, consistent with how v1
    hides the dashboard.
- **Optimistic update**: none applicable (read-only aggregate); see
  React Query Hooks section above for the reasoning.
- **Responsive**: `LeaderboardRow` drops the trophy icon's decorative
  padding on mobile but keeps rank number, avatar, username, and time
  all on one line down to 320px width — this is the one view in v2 most
  likely to be checked from a phone between study sessions, so it gets
  extra mobile attention.
- **Accessibility**:
  - The list is marked up as a real `<table>` (or `role="table"` +
    `role="row"`/`role="cell"` if a `<div>`-based grid is used for
    styling reasons) so screen readers announce rank/name/time as
    structured columns, not a flat list of text.
  - Rank is always textual ("#1", "#2", ...), never conveyed by row
    position or color alone; the top-3 trophy icon is `aria-hidden`
    with the rank number carrying the actual semantic weight.
  - Period tabs are a real `shadcn/tabs` (roving `tabindex`, arrow-key
    navigation, `aria-selected`).
  - The "You" pill on the actor's row has accessible text ("You"), not
    just a colored border.

## Acceptance Criteria

- [ ] Leaderboard totals for `all_time` match the sum a member would see
      in v1's dashboard for their own mapped categories in that
      community (cross-check: leaderboard total minutes == dashboard's
      per-member contribution figure).
- [ ] Tied totals receive the same rank, and the next distinct total's
      rank skips accordingly (competition ranking, not dense ranking).
- [ ] A member with zero mapped categories still appears in the ranking
      at `total_minutes = 0`, not omitted.
- [ ] The actor's own entry is always present in the response
      (`actor_entry`) even when their rank falls outside the top 20.
- [ ] `members_only` communities reject non-member requests with
      `"This community's data is only visible to members"`; `public`
      communities accept any authenticated actor.
- [ ] `day`/`week`/`month` windows are computed relative to request time
      and exclude sessions before the window start.
- [ ] Switching period in the UI does not lose the previously rendered
      list while the new one loads (`keepPreviousData` behavior
      verified).

## Testing Notes

- **Backend**:
  - `test_leaderboard_ranks_by_total_minutes_desc`
  - `test_leaderboard_ties_share_rank_competition_style`
  - `test_leaderboard_includes_unmapped_members_at_zero`
  - `test_leaderboard_actor_entry_present_outside_top_slice`
  - `test_leaderboard_members_only_rejects_non_member`
  - `test_leaderboard_public_allows_non_member`
  - `test_leaderboard_period_windows_exclude_out_of_range_sessions`
  - `test_leaderboard_all_time_matches_dashboard_aggregate` (integration
    test cross-checking against v1's dashboard query on the same fixture
    data)
- **Frontend** (Storybook):
  - `LeaderboardRow.stories.tsx` — rank 1/2/3 (with medal), rank 4+
    (no medal), current-user row, zero-minutes row
  - `LeaderboardList.stories.tsx` — actor within top 20, actor pinned
    below divider, empty (no time logged), loading
  - `Leaderboard.stories.tsx` — full component with period tabs,
    verifying tab switch doesn't blank the list (interaction test)
