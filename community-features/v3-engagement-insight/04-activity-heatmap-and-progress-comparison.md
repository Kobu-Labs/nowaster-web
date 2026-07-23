# Step 4: Activity Heatmap & Progress Comparison

## Overview

Two related insight views: a day-of-week × hour-of-day heatmap showing when
the community is most active, and a progress-comparison card showing a
member's own tracked time against the anonymous community average — never
another individual member's number. Both extend the same aggregation join
step 3 uses (`community_category_mapping` → `session`), and both are
independent of steps 1–2, buildable in parallel. The comparison view is the
one place in v3 with a real privacy decision to make explicit, since it's
the first feature that compares one member's number to a computed
aggregate rather than just displaying the community's total.

## Scope

- In scope:
  - Activity heatmap: 7×24 grid, total tracked minutes and session count
    per (day-of-week, hour-of-day) cell, community-wide (not per-member).
  - Progress comparison: the requesting member's own tracked minutes for a
    period vs. the community's average and median for the same period,
    plus a percentile ranking — all computed server-side so raw individual
    numbers of other members are never sent to the client.
  - A minimum-cohort guard: comparison data is withheld (not just
    obfuscated) when fewer than 3 other members have any tracked time in
    the period, to prevent trivially reverse-engineering one specific
    other member's number in a small community.
- Explicitly deferred:
  - **Per-member heatmap** — the heatmap is a community-aggregate view by
    design; a personal "when do I work" heatmap already fits better next to
    the existing personal statistics dashboard, not this feature.
  - **Comparison against a specific other member** — the whole point of
    "anonymous" comparison is that it's against the aggregate, never a
    named peer; a head-to-head comparison feature is a distinct, opt-in
    social feature (closer to v4's kudos/challenges) and isn't this.
  - **Timezone-normalized heatmap** — like streaks (step 2), the heatmap
    buckets by the DB connection's timezone via `EXTRACT(HOUR/DOW FROM
    start_time)`, not each member's personal timezone. A community with
    members spread across timezones will see a heatmap skewed toward
    whichever timezone the server evaluates in — documented as a known
    limitation, not fixed here, for the same reason step 2 didn't fix it
    for streaks (no per-user timezone column exists yet).

## Data Model

No new tables. One migration adds a supporting index for the heatmap's
`EXTRACT`-based grouping, continuing step 3's "aggregation at query time"
approach.

### Migration: `backend/migrations/0072_add_community_heatmap_index.sql`

```sql
-- The heatmap query groups by EXTRACT(DOW/HOUR FROM start_time) across
-- every mapped session for a community; a plain index on start_time lets
-- Postgres range-scan recent activity efficiently even though the
-- GROUP BY expression itself isn't indexed (functional indexes on EXTRACT
-- are not worth it here — the table being scanned per community is
-- already narrowed by the join to community_category_mapping first).
CREATE INDEX IF NOT EXISTS idx_session_start_time
    ON session (start_time)
    WHERE end_time IS NOT NULL;
```

## Backend Implementation

### Repository (`backend/src/repository/community_analytics.rs` — extends step 3's repository, same file)

```rust
impl CommunityAnalyticsRepository {
    /// 7x24 cells; only cells with activity are returned (sparse), the
    /// service fills zero-cells for the frontend so the grid is always
    /// complete.
    pub async fn get_activity_heatmap(
        &self,
        community_id: Uuid,
    ) -> Result<Vec<HeatmapCellRow>>;

    /// The requesting member's own total minutes for `period`.
    pub async fn get_member_minutes_for_period(
        &self,
        community_member_id: Uuid,
        period: AnalyticsPeriod,
    ) -> Result<f64>;

    /// Every *other* active member's total minutes for `period`, used only
    /// server-side to compute average/median/percentile — never returned
    /// to the client as a list.
    async fn get_other_members_minutes_for_period(
        &self,
        community_id: Uuid,
        excluding_member_id: Uuid,
        period: AnalyticsPeriod,
    ) -> Result<Vec<f64>>;
}

pub struct HeatmapCellRow {
    pub day_of_week: i16, // 0 = Sunday .. 6 = Saturday, matches Postgres EXTRACT(DOW)
    pub hour_of_day: i16, // 0-23
    pub total_minutes: f64,
    pub session_count: i64,
}
```

**Heatmap query**:

```sql
SELECT
    EXTRACT(DOW FROM s.start_time)::smallint AS day_of_week,
    EXTRACT(HOUR FROM s.start_time)::smallint AS hour_of_day,
    SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60)::float8 AS total_minutes,
    COUNT(*) AS session_count
FROM community_category_mapping ccm
JOIN community_member cm ON cm.id = ccm.community_member_id
JOIN session s
    ON s.category_id = ccm.personal_category_id
   AND s.user_id = cm.user_id
   AND s.end_time IS NOT NULL
WHERE cm.community_id = $1
GROUP BY day_of_week, hour_of_day;
```

**Other-members-minutes query** (feeds the comparison service, never
exposed row-by-row):

```sql
SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60), 0)::float8 AS minutes
FROM community_member cm
LEFT JOIN community_category_mapping ccm ON ccm.community_member_id = cm.id
LEFT JOIN session s
    ON s.category_id = ccm.personal_category_id
   AND s.user_id = cm.user_id
   AND s.end_time IS NOT NULL
   AND s.start_time >= $3 AND s.start_time < $4
WHERE cm.community_id = $1 AND cm.id != $2
GROUP BY cm.id;
```

(Returns one row per other member, `0.0` included for members with no
activity — deliberately, since "average across the whole community"
should include inactive members, not just active ones, or the average
would be misleadingly high.)

### Service (`backend/src/service/community_analytics_service.rs` — extends step 3's service, same file)

```rust
impl CommunityAnalyticsService {
    #[instrument(err, skip(self), fields(community_id = %community_id, actor_id = %actor))]
    pub async fn get_heatmap(&self, actor: &Actor, community_id: Uuid) -> Result<ReadHeatmapDto> {
        self.community_service.assert_can_view_analytics(actor, community_id).await?;
        let rows = self.repo.get_activity_heatmap(community_id).await?;
        Ok(ReadHeatmapDto::from_sparse_rows(rows)) // fills all 168 cells, zero where absent
    }

    /// The privacy-sensitive one. `actor` must be a community_member
    /// themself (comparison is meaningless for a public-data viewer with
    /// no membership) — enforced regardless of data_visibility.
    #[instrument(err, skip(self), fields(community_id = %community_id, actor_id = %actor))]
    pub async fn get_progress_comparison(
        &self,
        actor: &Actor,
        community_id: Uuid,
        period: AnalyticsPeriod,
    ) -> Result<ReadProgressComparisonDto> {
        let member = self.community_service
            .get_member_by_user(community_id, &actor.user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("You must be a member of this community to compare progress"))?;

        let your_minutes = self.repo.get_member_minutes_for_period(member.id, period).await?;
        let others = self.repo.get_other_members_minutes_for_period(community_id, member.id, period).await?;

        const MIN_COHORT_SIZE: usize = 3;
        if others.len() < MIN_COHORT_SIZE {
            return Ok(ReadProgressComparisonDto::insufficient_data(your_minutes));
        }

        let average = others.iter().sum::<f64>() / others.len() as f64;
        let median = median_of(&others);
        let percentile = percentile_rank(your_minutes, &others);

        Ok(ReadProgressComparisonDto {
            period,
            your_minutes,
            community_average_minutes: average,
            community_median_minutes: median,
            percentile: Some(percentile),
            comparable_member_count: others.len() as i32,
            insufficient_data: false,
        })
    }
}
```

The `MIN_COHORT_SIZE = 3` guard is the concrete mechanism behind "never
showing another individual member's number without their consent": with
only 1–2 other members, an average *is* effectively one or two individual
numbers, trivially back-computable by a member who already knows their own
number. Below the threshold, the endpoint returns `insufficient_data: true`
and omits average/median/percentile entirely rather than returning
misleadingly-precise aggregates over a tiny cohort.

### DTOs (`backend/src/dto/community_analytics.rs` — extends step 3's file)

```rust
#[derive(Clone, Serialize, Deserialize)]
pub struct HeatmapCellDto {
    pub day_of_week: i16,
    pub hour_of_day: i16,
    pub total_minutes: f64,
    pub session_count: i64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadHeatmapDto {
    pub cells: Vec<HeatmapCellDto>, // always exactly 168 entries (7*24)
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadProgressComparisonDto {
    pub period: AnalyticsPeriod,
    pub your_minutes: f64,
    pub community_average_minutes: f64,
    pub community_median_minutes: f64,
    /// 0-100, this member's rank among comparable members. None when
    /// insufficient_data is true.
    pub percentile: Option<f64>,
    pub comparable_member_count: i32,
    pub insufficient_data: bool,
}
```

### Router

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:community_id/analytics/heatmap` | `get_heatmap_handler` | member of community, or public data | Full 7x24 activity heatmap. |
| GET | `/api/community/:community_id/analytics/comparison` | `get_progress_comparison_handler` | must be a community member (not just public-data viewer) | Own minutes vs. anonymous community average. |

```rust
#[instrument(skip(state), fields(community_id = %community_id, actor_id = %actor, period = ?query.period))]
async fn get_progress_comparison_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    Query(query): Query<AnalyticsQueryDto>,
    actor: Actor,
) -> ApiResponse<ReadProgressComparisonDto> {
    let result = state
        .community_analytics_service
        .get_progress_comparison(&actor, community_id, query.period)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`api/definitions/models/community-analytics.ts` — extends step 3's file)

```ts
export const HeatmapCellSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  hourOfDay: z.number().int().min(0).max(23),
  totalMinutes: z.number(),
  sessionCount: z.number().int(),
});

export const HeatmapResponseSchema = z.object({
  cells: z.array(HeatmapCellSchema).length(168),
});

export const ProgressComparisonSchema = z.object({
  period: AnalyticsPeriodSchema,
  yourMinutes: z.number(),
  communityAverageMinutes: z.number(),
  communityMedianMinutes: z.number(),
  percentile: z.number().min(0).max(100).nullable(),
  comparableMemberCount: z.number().int(),
  insufficientData: z.boolean(),
});

export type HeatmapCell = z.infer<typeof HeatmapCellSchema>;
export type ProgressComparison = z.infer<typeof ProgressComparisonSchema>;
```

### API Client (`api/communityAnalyticsApi.ts` — extends step 3's file)

```ts
export const getHeatmap = async (params: CommunityAnalyticsRequest["getHeatmap"]) => {
  const { data } = await baseApi.get(`/community/${params.communityId}/analytics/heatmap`);
  return await parseResponseUnsafe(data, CommunityAnalyticsResponseSchema.getHeatmap);
};

export const getProgressComparison = async (
  params: CommunityAnalyticsRequest["getProgressComparison"],
) => {
  const { data } = await baseApi.get(
    `/community/${params.communityId}/analytics/comparison`,
    { params: { period: params.period } },
  );
  return await parseResponseUnsafe(data, CommunityAnalyticsResponseSchema.getProgressComparison);
};
```

### React Query Hooks

- `useCommunityHeatmap(communityId: string)` — `useQuery`, `staleTime:
  5 * 60_000` (heatmap shape changes slowly, refetch less aggressively
  than distribution/trends).
- `useCommunityProgressComparison(communityId: string, period:
  AnalyticsPeriod)` — `useQuery`, `staleTime: 60_000`.

`queryKeys.ts` additions:

```ts
const communityAnalyticsKeys = createQueryKeys("communityAnalytics", {
  // ...distribution, trends from step 3...
  heatmap: (communityId: string) => ({
    queryFn: async () => await CommunityAnalyticsApi.getHeatmap({ communityId }),
    queryKey: [communityId, "heatmap"],
  }),
  comparison: (communityId: string, period: AnalyticsPeriod) => ({
    queryFn: async () =>
      await CommunityAnalyticsApi.getProgressComparison({ communityId, period }),
    queryKey: [communityId, "comparison", period],
  }),
});
```

### UI Components

- `components/community/analytics/ActivityHeatmap.tsx` — a 7x24 CSS grid
  (not a recharts component; recharts has no native heatmap primitive, and
  a `grid` of `<div>` cells gives full control over the non-color-reliant
  encoding described below). Rows = hour-of-day (0–23, label every 3rd
  hour to avoid crowding), columns = day-of-week (Mon–Sun, matching the
  rest of the app's week-start convention).
- `components/community/analytics/HeatmapCell.tsx` — one cell: background
  opacity mapped to `totalMinutes` (0 → transparent, max-in-grid → full
  tint), plus a `title`/tooltip with exact minutes and session count.
- `components/community/analytics/ProgressComparisonCard.tsx` — the
  member's own number front-and-center (large text), average/median as
  secondary stats, percentile as a horizontal position marker on a simple
  0–100 track (not a chart library element — a styled `<div>` bar is
  sufficient and easier to make accessible).
- `components/community/analytics/AnalyticsDataTable.tsx` — reused from
  step 3; heatmap gets its own table variant (Day × Hour × Minutes rows)
  behind the same "View as table" toggle.

User journey:
1. Analytics tab (from step 3) gains two more sections below distribution/
   trends: "Activity Heatmap" and "Your Progress."
2. `ActivityHeatmap` loads once (not period-scoped — it's always
   all-time-shaped, matching "when is this community most active" as a
   standing fact rather than a per-period stat) and renders the 7x24 grid;
   hovering/tapping a cell shows exact minutes + session count.
3. `ProgressComparisonCard` uses the same `AnalyticsPeriodSelector` state
   as distribution/trends (shared period across the whole tab) and shows
   the member's own number vs. the community aggregate; if
   `insufficientData` is true, the card shows a explanatory message instead
   of numbers (see Empty state).

## UX & Polish

- **Loading state**: `ActivityHeatmap` skeleton is the same 7x24 grid with
  every cell at a uniform low-opacity grey (not blank/hidden), so the grid
  shape itself never shifts once real data replaces the placeholder tint.
  `ProgressComparisonCard` skeleton is three stacked text-line
  placeholders (your number / average / percentile bar).
- **Empty state**:
  - Heatmap with zero mapped sessions ever: *"No activity yet — once
    members start logging tracked time, this heatmap will show when your
    community is most active."* (grid renders fully transparent, not
    hidden, so the shape is still visible).
  - Comparison with `insufficientData: true`: *"Not enough members have
    tracked time yet to show a fair community average. Check back once a
    few more people have logged sessions."* — your own number (`your_minutes`)
    is still shown; only the comparison part is withheld.
- **Error state**: toast — title `"Couldn't load activity data"`,
  description `"Something went wrong loading the heatmap. Try again."` for
  the heatmap; `"Couldn't load your progress comparison"` /
  `"Something went wrong comparing your progress. Try again shortly."` for
  the comparison card. Both `variant: "destructive"`.
- **Optimistic/real-time feel**: not applicable (read-only aggregates,
  same reasoning as step 3).
- **Responsive**: `ActivityHeatmap` is the one component in this version
  that genuinely cannot just "shrink" on mobile — 24 hour-rows at readable
  tap-target size don't fit a phone viewport. Mobile treatment: collapse
  to a day-of-week × **4-hour-bucket** grid (6 buckets instead of 24 hours,
  labeled "12–4am", "4–8am", etc.) below the `sm` breakpoint, with a
  "View full hourly breakdown" link that opens the 7x24 version in a
  full-screen sheet the user can pinch-zoom/scroll. This is a real
  alternate layout, not a shrunk copy of the desktop grid.
- **Accessibility**: heatmap cells are non-color-reliant via two
  redundant signals — opacity (already specified) *and* a numeric label
  inside cells above a size threshold (cells below that threshold rely on
  the always-present data-table fallback, `AnalyticsDataTable`'s heatmap
  variant, reachable via the same "View as table" toggle pattern as step
  3). Each cell is a focusable element (`tabIndex=0`, `role="gridcell"`
  within a `role="grid"` container) with `aria-label="{day}, {hour}: {N}
  minutes across {M} sessions"`. `ProgressComparisonCard`'s percentile bar
  uses `role="meter"` with `aria-valuenow/min/max/valuetext` (valuetext
  spells out "72nd percentile" rather than leaving a screen reader to
  read a bare "72").

## Acceptance Criteria

- [ ] `GET .../analytics/heatmap` always returns exactly 168 cells (7×24),
      zero-filled where there's no activity, regardless of how sparse the
      underlying data is.
- [ ] `GET .../analytics/comparison` returns `insufficientData: true` and
      omits average/median/percentile when fewer than 3 other members have
      any tracked time in the period, while still returning the
      requester's own `yourMinutes`.
- [ ] The comparison endpoint never returns a list of other members' raw
      minute totals in any response shape, at any cohort size.
- [ ] A non-member of a `members_only` community gets a clear permission
      error from `.../comparison` even though they might be able to view
      `.../distribution` if the community were `public` data (comparison
      always requires membership, independent of `data_visibility`).
- [ ] Mobile viewport renders the 4-hour-bucket heatmap variant, not a
      squeezed 24-row grid.
- [ ] Heatmap and comparison both have a working "View as table"
      accessible fallback.

## Testing Notes

- Backend (`cargo test`):
  - `get_heatmap_returns_all_168_cells_even_with_single_session`
  - `get_progress_comparison_insufficient_data_below_three_other_members`
  - `get_progress_comparison_average_includes_zero_activity_members`
    (a member with 0 tracked minutes in the period must still be counted
    in the average's denominator, pulling it down — not excluded).
  - `get_progress_comparison_requires_membership_regardless_of_data_visibility`
  - `get_progress_comparison_percentile_matches_manual_calculation` (fixed
    fixture of 5 known member totals, assert the exact expected
    percentile for a known value).
- Frontend (Storybook):
  - `ActivityHeatmap.stories.tsx`: populated (uneven distribution to check
    opacity scaling), all-zero (empty state), mobile-width variant showing
    the 4-hour-bucket layout.
  - `ProgressComparisonCard.stories.tsx`: above average, below average,
    exactly at average, `insufficientData: true`.
  - `HeatmapCell.stories.tsx`: focus-visible state, tooltip content at
    min/max opacity extremes.
