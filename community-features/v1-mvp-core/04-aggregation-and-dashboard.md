# Step 4: Aggregation and Dashboard

## Overview

This is the payoff step: it reads everyone's sessions through the mapping
table Step 3 built and renders the community dashboard — total tracked time,
a per-tracked-category breakdown, and a member contribution list — while
respecting `data_visibility`. It depends on `community` (Step 1),
`community_member` (Step 2), and `community_tracked_category` /
`community_category_mapping` (Step 3). Aggregation is computed at query time
against the existing `session` table; v1 deliberately does not denormalize
or cache totals (per the v1 README: "correctness and UX, not scale").

## Scope

- In scope:
  - A read-only aggregation query/service joining `session` through
    `community_category_mapping` to `community_tracked_category`
  - Community-level total time and per-tracked-category breakdown
  - Per-member contribution (total time each member has logged toward this
    community)
  - `data_visibility` enforcement: `members_only` dashboards are only
    readable by members; `public` dashboards are readable by any signed-in
    user
  - The dashboard UI: summary stat cards, category breakdown list, member
    leaderboard-free contribution list (no ranking/gamification framing yet
    — just "who's contributed what")
- Explicitly deferred:
  - Denormalized/cached totals, materialized views, background recompute
    jobs (→ later, if/when scale demands it — not part of any version's
    plan yet, noted here only as a non-goal)
  - Leaderboards (ranked, competitive framing), badges, streaks (→ v2/v3)
  - Time range filtering on the dashboard (v1 shows all-time totals only;
    date-range filters are a natural v2/v3 addition but not committed to
    the roadmap yet, so not scoped here)
  - Activity feed, charts/heatmaps, trend lines (→ v3)
  - Only `fixed` sessions and completed `stopwatch` sessions with an
    `end_time` count toward totals — an in-progress stopwatch session (no
    `end_time` yet) is excluded until it's stopped, consistent with how
    `StatisticsRepository::get_total_session_time` already only sums
    `session` rows (fixed sessions), not live stopwatch state

## Data Model

No new tables. This step adds one migration purely for query performance,
since the aggregation queries below join `session` on `category_id` and
`user_id`, and neither column has an index today:

- Migration filename: `backend/migrations/0060_add_session_category_user_index.sql`

```sql
-- backend/migrations/0060_add_session_category_user_index.sql

-- Supports the community dashboard's join from community_category_mapping
-- (personal_category_id, user_id) into session (category_id, user_id).
-- Also generally useful for any future per-category, per-user query.
CREATE INDEX IF NOT EXISTS idx_session_user_id_category_id
    ON session(user_id, category_id);
```

No new Rust entities. The aggregation result types are plain DTOs (see
below) built from ad-hoc query rows, following the same pattern as
`DashboardData` in `backend/src/dto/statistics/dashboard.rs`.

### Correctness note: why totals use `DISTINCT` session sets

`community_category_mapping` is intentionally many-to-many (Step 3): one
personal category can map to more than one tracked category. That's the
right model for "this category counts toward both X and Y," but it means a
naive `SUM` across a join from `session` through
`community_category_mapping` to `community_tracked_category` would
**double-count** a session's minutes in the *community-wide total* (though
not in the *per-category breakdown*, where seeing the same time reflected in
two categories is correct and expected — it genuinely contributed to both).

So:
- **Per-category breakdown**: sum per tracked category independently
  (double-counting across categories is correct here).
- **Community-wide total** and **per-member total**: first collapse to the
  distinct set of qualifying sessions (a session counts once even if its
  category maps to three tracked categories), then sum.

## Backend Implementation

### Repository (`backend/src/repository/community_dashboard.rs`, new file)

```rust
#[derive(Clone)]
pub struct CommunityDashboardRepository { db: Arc<Database> }
```

- `pub fn new(db_conn: &Arc<Database>) -> Self`
- `pub async fn get_total_minutes(&self, community_id: Uuid) -> Result<(f64, i64)>` —
  returns `(total_minutes, session_count)` over the **distinct** qualifying
  session set for the whole community.
- `pub async fn get_category_breakdown(&self, community_id: Uuid) -> Result<Vec<CategoryBreakdownRow>>` —
  per-tracked-category totals (double-counting across categories allowed by
  design, see note above).
- `pub async fn get_member_contributions(&self, community_id: Uuid) -> Result<Vec<MemberContributionRow>>` —
  per-member totals over each member's own **distinct** qualifying session
  set, including members with zero mapped time (left join, not inner join,
  so a member who joined but hasn't mapped anything yet still appears at 0).

```rust
#[derive(Clone, sqlx::FromRow)]
pub struct CategoryBreakdownRow {
    pub tracked_category_id: Uuid,
    pub name: String,
    pub color: String,
    pub total_minutes: f64,
    pub session_count: i64,
}

#[derive(Clone, sqlx::FromRow)]
pub struct MemberContributionRow {
    pub user_id: String,
    pub username: String,
    pub avatar_url: Option<String>,
    pub total_minutes: f64,
    pub session_count: i64,
}
```

Query bodies (via `crate::named_query!`, matching the rest of the codebase):

```rust
// get_total_minutes
crate::named_query!(
    "community_dashboard_total",
    sqlx::query(
        r#"
        WITH qualifying_sessions AS (
            SELECT DISTINCT s.id, s.start_time, s.end_time
            FROM session s
            JOIN community_category_mapping ccm
                ON ccm.personal_category_id = s.category_id
                AND ccm.user_id = s.user_id
            WHERE ccm.community_id = $1
              AND s.end_time IS NOT NULL
        )
        SELECT
            COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))) / 60, 0) AS total_minutes,
            COUNT(*) AS session_count
        FROM qualifying_sessions
    "#,
    )
    .bind(community_id)
    .fetch_one(self.db.get_pool())
)?;
```

```rust
// get_category_breakdown
crate::named_query!(
    "community_dashboard_category_breakdown",
    sqlx::query_as::<_, CategoryBreakdownRow>(
        r#"
        SELECT
            tc.id AS tracked_category_id,
            tc.name,
            tc.color,
            COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time))) / 60, 0) AS total_minutes,
            COUNT(s.id) AS session_count
        FROM community_tracked_category tc
        LEFT JOIN community_category_mapping ccm
            ON ccm.tracked_category_id = tc.id
        LEFT JOIN session s
            ON s.category_id = ccm.personal_category_id
            AND s.user_id = ccm.user_id
            AND s.end_time IS NOT NULL
        WHERE tc.community_id = $1
        GROUP BY tc.id, tc.name, tc.color
        ORDER BY total_minutes DESC, tc.name ASC
    "#,
    )
    .bind(community_id)
    .fetch_all(self.db.get_pool())
)?;
```

```rust
// get_member_contributions
crate::named_query!(
    "community_dashboard_member_contributions",
    sqlx::query_as::<_, MemberContributionRow>(
        r#"
        WITH qualifying_sessions AS (
            SELECT DISTINCT s.id, s.user_id, s.start_time, s.end_time
            FROM session s
            JOIN community_category_mapping ccm
                ON ccm.personal_category_id = s.category_id
                AND ccm.user_id = s.user_id
            WHERE ccm.community_id = $1
              AND s.end_time IS NOT NULL
        )
        SELECT
            cm.user_id,
            u.displayname AS username,
            u.avatar_url,
            COALESCE(SUM(EXTRACT(EPOCH FROM (qs.end_time - qs.start_time))) / 60, 0) AS total_minutes,
            COUNT(qs.id) AS session_count
        FROM community_member cm
        JOIN "user" u ON u.id = cm.user_id
        LEFT JOIN qualifying_sessions qs ON qs.user_id = cm.user_id
        WHERE cm.community_id = $1
        GROUP BY cm.user_id, u.displayname, u.avatar_url
        ORDER BY total_minutes DESC, u.displayname ASC
    "#,
    )
    .bind(community_id)
    .fetch_all(self.db.get_pool())
)?;
```

### Service (`backend/src/service/community_dashboard_service.rs`, new file)

Business rules:

- **Get dashboard**: resolves the community (via `CommunityRepository`, or a
  shared helper — reuse `CommunityService`'s internal lookup rather than
  re-querying, e.g. `CommunityDashboardService` is constructed with a
  `CommunityRepository` clone alongside its own `CommunityDashboardRepository`
  and `CommunityRepository::find_membership`).
  - Community not found or archived → `Err(anyhow!("Community not found"))`.
  - `data_visibility == MembersOnly` and actor is not a member → `Err(anyhow!("You must be a member to view this community's dashboard"))`.
  - `data_visibility == Public` → any signed-in actor may view.
  - Runs the three repository queries (can be `tokio::join!`'d for
    parallelism since they're independent read queries against the same
    pool), assembles `CommunityDashboardDto`, computes each row's
    `percentage` as `total_minutes / grand_total_minutes * 100` (guarding
    `grand_total_minutes == 0` → `0.0` for every row rather than `NaN`).

```rust
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
```

`CommunityDashboardService` method:

- `pub async fn get_dashboard(&self, community_id: Uuid, actor: &Actor) -> Result<CommunityDashboardDto>`

### DTOs (`backend/src/dto/...`)

- `backend/src/dto/community_dashboard/dashboard.rs` → `CommunityDashboardDto`, `CategoryBreakdownDto`, `MemberContributionDto`
- `backend/src/dto/community_dashboard/mod.rs`; add `pub mod community_dashboard;` to `backend/src/dto/mod.rs`.

(As with Step 1's note on DTO placement: these could alternatively live
directly in the service module the way `friend_service.rs` does it — either
is consistent with existing precedent in this codebase. This spec places
them in `dto/` for consistency with Steps 1–3 of this same feature.)

### Router (`backend/src/router/community/dashboard.rs`, new file, merged into `community_router()`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/{community_id}/dashboard` | `get_community_dashboard_handler` | required; gated by `data_visibility` | Total time, category breakdown, and member contributions |

```rust
// backend/src/router/community/dashboard.rs
use axum::{
    extract::{Path, State},
    routing::get,
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    router::{clerk::Actor, response::ApiResponse, root::AppState},
    service::community_dashboard_service::CommunityDashboardDto,
};

pub fn dashboard_routes() -> Router<AppState> {
    Router::new().route("/{community_id}/dashboard", get(get_community_dashboard_handler))
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn get_community_dashboard_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<CommunityDashboardDto> {
    let result = state
        .community_dashboard_service
        .get_dashboard(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

Wiring: `AppState` gains `community_dashboard_service: CommunityDashboardService`.
`community_router()` becomes
`Router::new().merge(crud_routes()).merge(membership_routes()).merge(category_mapping_routes()).merge(dashboard_routes())`
— this is the final shape of the v1 community router.

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,responses}/community.ts`)

`next-frontend/api/definitions/models/community.ts` additions:

```ts
export const CategoryBreakdownSchema = z.object({
  tracked_category_id: z.uuid(),
  name: z.string(),
  color: z.string(),
  total_minutes: z.number(),
  session_count: z.number(),
  percentage: z.number(),
});

export const MemberContributionSchema = z.object({
  user: UserSchema.merge(z.object({ avatar_url: z.string().nullable() })),
  total_minutes: z.number(),
  session_count: z.number(),
  percentage: z.number(),
});

export const CommunityDashboardSchema = z.object({
  community_id: z.uuid(),
  total_minutes: z.number(),
  total_sessions: z.number(),
  member_count: z.number(),
  categories: z.array(CategoryBreakdownSchema),
  members: z.array(MemberContributionSchema),
  generated_at: z.coerce.date<Date>(),
});

export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>;
export type MemberContribution = z.infer<typeof MemberContributionSchema>;
export type CommunityDashboard = z.infer<typeof CommunityDashboardSchema>;
```

`next-frontend/api/definitions/requests/community.ts` addition:

```ts
const getDashboard = z.object({ communityId: z.uuid() });
```

`next-frontend/api/definitions/responses/community.ts` addition:

```ts
getDashboard: CommunityDashboardSchema,
```

### API Client (`next-frontend/api/communityApi.ts` — addition)

```ts
export const getDashboard = async (params: CommunityRequest["getDashboard"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/dashboard`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getDashboard);
};
```

### React Query Hooks (`next-frontend/components/hooks/community/...`)

`queryKeys.communities` addition:

```ts
dashboard: (communityId: string) => ({
  queryFn: async () => await CommunityApi.getDashboard({ communityId }),
  queryKey: [communityId, "dashboard"],
}),
```

Hook:
- `useCommunityDashboard.ts` → `useCommunityDashboard(communityId: string)` —
  `useQuery({ ...queryKeys.communities.dashboard(communityId), staleTime: 60_000 })`.
  A 60-second `staleTime` is reasonable here — unlike `tags`/`categories`
  (`staleTime: Infinity`, rarely change), dashboard totals change whenever
  anyone logs a session, but re-fetching on every render would be wasteful
  since it's a moderately expensive aggregation query; the dashboard also
  gets a manual "Refresh" affordance (see UI) for a user who wants the very
  latest number without waiting.

No mutation hook — this endpoint is read-only.

### UI Components

- `CommunityDetailPage.tsx` (from Steps 1–3, extended one final time) — gains a "Dashboard" section (or becomes tab-based: **Overview / Members / Categories** — see below) rendering `<CommunityDashboard communityId={id} />` as the default/landing tab, since the dashboard is the primary reason a member returns to a community.
- `next-frontend/components/visualizers/communities/CommunityDetailTabs.tsx` — introduces `Tabs`/`TabsList`/`TabsContent` (`components/shadcn/tabs.tsx`) with three tabs: **Overview** (dashboard — this step), **Members** (Step 2's `MemberList`), **Categories** (Step 3's `TrackedCategoryManager` + `MyMappingsList`). This consolidates what had been a single long scrolling page across Steps 1–3 into a navigable structure now that there's enough content to warrant it.
- `next-frontend/components/visualizers/communities/CommunityDashboard.tsx` — top-level dashboard component: renders `DashboardStatCards`, `CategoryBreakdownList`, and `MemberContributionList`, plus a manual refresh button (`RefreshCw` icon, calls `queryClient.invalidateQueries` for the dashboard key) and a "Last updated {relative time}" caption using `generated_at`.
- `next-frontend/components/visualizers/communities/DashboardStatCards.tsx` — a row of 3 `Card`s: "Total Time" (formatted as `Xh Ym`, reusing the app's existing minutes-to-duration formatter if one exists in `lib/utils`, else a small local helper), "Sessions Logged", "Active Members" (members with `total_minutes > 0` out of `member_count`).
- `next-frontend/components/visualizers/communities/CategoryBreakdownList.tsx` — one horizontal proportional bar per tracked category: color-dot + name on the left, a `Progress`-style filled bar sized to `percentage`, and `Xh Ym (NN%)` on the right; sorted by `total_minutes` descending (already sorted server-side). Categories with `total_minutes === 0` render at the bottom in a visually muted state, not hidden, so a member can see what's *not* being tracked yet.
- `next-frontend/components/visualizers/communities/MemberContributionList.tsx` — table (desktop) / stacked cards (mobile), same responsive pattern as `MemberList` from Step 2: avatar, username, `Xh Ym`, session count, sorted by time descending; the viewer's own row is visually highlighted (subtle background tint, not just an icon) so they can find themselves in a long list quickly.

**User journey — member checks community progress:**

1. Member opens `/home/communities/[id]`, lands on the "Overview" tab by default.
2. They see three stat cards: "Total Time: 342h 15m", "Sessions Logged: 891", "Active Members: 24 / 31".
3. Below, `CategoryBreakdownList` shows "Algorithms" at 45% with the longest bar, "Databases" at 30%, "Operating Systems" at 5%, and a fourth tracked category "Networking" at 0% shown muted at the bottom (nobody's mapped anything to it yet — a visible signal to the owner that it needs attention or isn't relevant).
4. They scroll to `MemberContributionList` and immediately spot their own row highlighted, showing "18h 40m" and where that places them relative to others (no explicit rank number in v1 — that framing is deferred to v2's leaderboard — but the sorted list makes relative standing legible without a scoreboard).
5. They click "Refresh" after finishing a session they just logged, and the numbers update to reflect it within a second.

## UX & Polish

- **Loading state**: `DashboardStatCards` shows 3 skeleton cards (fixed height, matching real card dimensions). `CategoryBreakdownList` shows 4 skeleton bars (fixed-width color dot + variable-width shimmering bar + fixed-width trailing text placeholder). `MemberContributionList` shows the same 5-skeleton-row treatment as Step 2's `MemberList`. All three load in parallel (`useCommunityDashboard` is one query backing all three components, so they share one loading boundary — no staggered pop-in).
- **Empty state**: A brand-new community with tracked categories defined but zero logged sessions shows: stat cards all reading "0h 0m" / "0 sessions" / "0 / N members active" (not hidden — zero is informative), `CategoryBreakdownList` shows every tracked category muted at 0%, and below the whole dashboard a single centered callout: heading **"No time logged yet"**, body **"Once members map their categories and log sessions, this dashboard fills in automatically."** with a `BarChart3` (lucide-react) icon. If there are zero tracked categories at all (owner hasn't done Step 3's setup), the dashboard instead shows a redirect-style empty state: **"Set up tracked categories to start seeing community stats"** with a button (owner only) jumping to the Categories tab.
- **Error states**:
  - Dashboard fetch failure (network/server error) → the dashboard area shows an inline error block (not a toast, since this is the primary content of the page, not a side-effect of an action): **"Couldn't load the dashboard"** with body `error.message` and a "Try again" button that refetches.
  - `data_visibility` rejection (non-member viewing a members-only community that somehow rendered this page, e.g. via stale UI state after being removed) → same inline error block, body **"You need to be a member of this community to view its dashboard."**, with a "Back to Communities" link.
  - No inline form validation needed — this view has no forms, only a refresh action.
- **Optimistic update**: None — this is a read-only aggregation view; there's no local action to optimistically reflect. The one interactive affordance (manual refresh) shows a spinning `RefreshCw` icon while in flight rather than faking a result.
- **Responsive**: `DashboardStatCards` is `grid-cols-1 sm:grid-cols-3`. `CategoryBreakdownList` bars remain full-width at all sizes (they're already a single-column layout). `MemberContributionList` follows Step 2's table→stacked-cards breakpoint. `CommunityDetailTabs`'s tab list becomes horizontally scrollable (not wrapped) below `sm`, consistent with common shadcn `Tabs` mobile handling.
- **Accessibility**: Proportional bars in `CategoryBreakdownList` use `role="progressbar"` with `aria-valuenow`/`aria-valuemin={0}`/`aria-valuemax={100}` and an `aria-label` stating the category name and percentage together ("Algorithms, 45 percent of tracked time"), not conveyed by bar width alone. The 0%-muted categories are distinguished by both reduced opacity *and* a "(no time yet)" text suffix, not opacity alone. `MemberContributionList`'s "your row" highlight is paired with a `(You)` text suffix next to the username, not just a background color. Tab navigation (`CommunityDetailTabs`) is fully keyboard-operable (Arrow keys move between tabs per the shadcn/Radix `Tabs` default behavior) with `aria-selected` reflecting the active tab.

## Acceptance Criteria

- [ ] Migration `0060_add_session_category_user_index.sql` applies cleanly on top of `0059`.
- [ ] `GET /api/community/{id}/dashboard` for a `members_only` community returns an error for a non-member and data for a member.
- [ ] `GET /api/community/{id}/dashboard` for a `public` community returns data for any signed-in user, member or not.
- [ ] A session whose personal category maps to two different tracked categories contributes its full duration to *both* categories in the breakdown, but is counted only *once* in `total_minutes` and in that member's own contribution total.
- [ ] A member with no mappings appears in the member contribution list at `0` minutes, not omitted.
- [ ] A tracked category with no mappings appears in the breakdown at `0` minutes with `session_count: 0`, not omitted.
- [ ] In-progress (unfinished, `end_time IS NULL`) stopwatch sessions are excluded from all totals.
- [ ] `percentage` fields sum to (approximately, floating point) 100 across `categories` when `total_minutes > 0`, and every row reads `0.0` (not `NaN`/error) when `total_minutes == 0`.
- [ ] Frontend: the dashboard renders all three sections (stat cards, category breakdown, member contributions) from a single query and a single shared loading state.
- [ ] Frontend: the viewer's own row in the member contribution list is visually distinguishable and text-labeled, not just colored.

## Testing Notes

- Backend:
  - `dashboard_rejects_non_member_when_members_only`.
  - `dashboard_allows_non_member_when_public`.
  - `dashboard_total_minutes_does_not_double_count_multi_mapped_session` — map one personal category to two tracked categories, log one session in it, assert `total_minutes` reflects the session's duration exactly once while both categories' `total_minutes` in the breakdown each show the full duration.
  - `dashboard_excludes_sessions_without_end_time` — create an in-progress stopwatch session, assert it contributes nothing.
  - `dashboard_includes_zero_activity_members_and_categories` — a member with no sessions and a tracked category with no mappings both appear at zero, not omitted.
  - `dashboard_percentages_sum_to_100_when_total_nonzero`.
  - `dashboard_percentages_are_zero_not_nan_when_total_is_zero`.
- Frontend (Storybook):
  - `CommunityDashboard.stories.tsx` — loading (all three skeleton sections), empty (no tracked categories yet), empty (tracked categories exist, zero time logged), populated (realistic multi-member, multi-category data), error (inline error block with retry).
  - `CategoryBreakdownList.stories.tsx` — populated with a mix of active and zero-activity categories, single category, many categories (scroll/wrap behavior).
  - `MemberContributionList.stories.tsx` — populated with viewer highlighted, desktop table, mobile stacked cards, large member count (30+, verifying no pagination is silently required at v1 scale but the list remains scannable).
  - `DashboardStatCards.stories.tsx` — zero state, populated state, large numbers (formatting check, e.g. `1000h+`).
