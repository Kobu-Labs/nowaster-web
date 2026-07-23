# Step 3: Analytics — Distribution & Trends

## Overview

A dedicated analytics tab for the community: how time is distributed across
tracked categories right now, and which categories are trending up or down
compared to the previous equivalent period. This extends v1 step 4's
aggregation query (same join shape: `community_category_mapping` →
`session`) rather than replacing it, and reuses v2 step 4's leaderboard
period-selector UI pattern so the whole dashboard feels like one control
surface, not three different date pickers. This step is independent of
steps 1–2 (badges/streaks) and can be built in parallel with them.

## Scope

- In scope:
  - Time distribution: total tracked minutes per tracked category, for a
    selected period (day/week/month/all-time — same period enum v2's
    leaderboard already introduced).
  - Trending categories: percent change in minutes for each tracked
    category vs. the immediately preceding period of equal length, surfaced
    as "trending up" / "trending down" with a ranked list.
  - Two charts: a distribution pie/donut (reusing `recharts`, same library
    and interaction pattern as `SessionPieChartUiProvider`) and a trend bar
    chart (percent change per category, reusing the styling conventions of
    `SessionBaseAreaChartUiProvider`).
  - A plain-text/table fallback for both charts (accessibility + small
    screens).
- Explicitly deferred:
  - **Per-member distribution breakdown** (individual member's category
    split) — the community-level dashboard already shows *whose*
    contribution is what via the member list; this step is about the
    community's aggregate shape, not re-deriving per-member charts. A
    member's own personal category distribution already exists via the
    non-community statistics dashboard (`StatisticsService`).
  - **Custom date range picker** — only the four fixed periods the
    leaderboard already uses. A custom range is a plausible v4 "analytics
    export" companion feature, not decided here.
  - **Forecasting/projection** ("at this rate you'll hit X hours by...") —
    pure historical reporting only in v3.

## Data Model

No new tables — this step is pure aggregation over existing v1 tables
(`community_category_mapping`, `community_tracked_category`) and `session`,
consistent with v1's "aggregation computed at query time, no
denormalization/caching yet" decision. One migration adds indexes to keep
that query-time aggregation fast as communities grow.

### Migration: `backend/migrations/0071_add_community_analytics_indexes.sql`

```sql
-- Community aggregation queries (v1 dashboard, this step, and step 4) all
-- join community_category_mapping -> session on (personal_category_id,
-- user_id) and filter session by start_time range. Index the mapping
-- table's join column and confirm session already has what it needs.
CREATE INDEX IF NOT EXISTS idx_community_category_mapping_personal_category
    ON community_category_mapping (personal_category_id);

CREATE INDEX IF NOT EXISTS idx_community_category_mapping_member
    ON community_category_mapping (community_member_id);

-- session is queried by (user_id, category_id, start_time) in every
-- aggregation join; this composite index lets Postgres use an index-only
-- scan for the common "this user, this category, this period" predicate
-- instead of a sequential scan per member per tracked category.
CREATE INDEX IF NOT EXISTS idx_session_user_category_start_time
    ON session (user_id, category_id, start_time)
    WHERE end_time IS NOT NULL;
```

No new Rust entities — this step's repository returns plain aggregation
DTOs (below), not entities backed by a table.

## Backend Implementation

### Repository (`backend/src/repository/community_analytics.rs`)

```rust
pub struct CommunityAnalyticsRepository { db: Arc<Database> }

#[derive(Clone, Copy, Debug, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "text")]
pub enum AnalyticsPeriod { Day, Week, Month, AllTime } // shared with v2 leaderboard's period type

impl CommunityAnalyticsRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    /// Total tracked minutes per tracked category, for `period`.
    pub async fn get_category_distribution(
        &self,
        community_id: Uuid,
        period: AnalyticsPeriod,
    ) -> Result<Vec<CategoryMinutesRow>>;

    /// Same shape, called twice by the service (current period, previous
    /// period of equal length) to compute trend deltas.
    pub async fn get_category_minutes_for_range(
        &self,
        community_id: Uuid,
        range_start: DateTime<Local>,
        range_end: DateTime<Local>,
    ) -> Result<Vec<CategoryMinutesRow>>;
}

pub struct CategoryMinutesRow {
    pub tracked_category_id: Uuid,
    pub name: String,
    pub color: String,
    pub total_minutes: f64,
}
```

**Distribution query shape** (`get_category_minutes_for_range`, the
building block both public repo methods use):

```sql
SELECT
    ctc.id AS tracked_category_id,
    ctc.name,
    ctc.color,
    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60), 0)::float8 AS total_minutes
FROM community_tracked_category ctc
LEFT JOIN community_category_mapping ccm ON ccm.tracked_category_id = ctc.id
LEFT JOIN community_member cm ON cm.id = ccm.community_member_id
LEFT JOIN session s
    ON s.category_id = ccm.personal_category_id
   AND s.user_id = cm.user_id
   AND s.end_time IS NOT NULL
   AND s.start_time >= $2
   AND s.start_time < $3
WHERE ctc.community_id = $1
GROUP BY ctc.id, ctc.name, ctc.color
ORDER BY total_minutes DESC;
```

Note the `LEFT JOIN`s from `community_tracked_category` (not an `INNER
JOIN` starting from the mapping table, as step 1/2's per-member sums do) —
this deliberately returns a zero-minute row for every tracked category with
no activity in the period, so the distribution chart and its accessible
table fallback both show the community's full set of tracked categories,
not just the ones with data.

### Service (`backend/src/service/community_analytics_service.rs`)

```rust
#[derive(Clone)]
pub struct CommunityAnalyticsService {
    repo: CommunityAnalyticsRepository,
    community_service: CommunityService, // for data_visibility + membership checks, v1
}

impl CommunityAnalyticsService {
    #[instrument(err, skip(self), fields(community_id = %community_id, actor_id = %actor))]
    pub async fn get_distribution(
        &self,
        actor: &Actor,
        community_id: Uuid,
        period: AnalyticsPeriod,
    ) -> Result<ReadDistributionDto> {
        self.community_service.assert_can_view_analytics(actor, community_id).await?;
        let rows = self.repo.get_category_distribution(community_id, period).await?;
        Ok(ReadDistributionDto {
            period,
            categories: rows.into_iter().map(Into::into).collect(),
        })
    }

    #[instrument(err, skip(self), fields(community_id = %community_id, actor_id = %actor))]
    pub async fn get_trends(
        &self,
        actor: &Actor,
        community_id: Uuid,
        period: AnalyticsPeriod,
    ) -> Result<ReadTrendsDto> {
        self.community_service.assert_can_view_analytics(actor, community_id).await?;

        let (current_start, current_end) = period.to_range(Local::now());
        let period_length = current_end - current_start;
        let previous_start = current_start - period_length;

        let current = self.repo.get_category_minutes_for_range(community_id, current_start, current_end).await?;
        let previous = self.repo.get_category_minutes_for_range(community_id, previous_start, current_start).await?;

        // AllTime has no meaningful "previous period" — the handler/service
        // short-circuits and returns trends with `percent_change: None` for
        // every category rather than dividing by an arbitrary window.
        if matches!(period, AnalyticsPeriod::AllTime) {
            return Ok(ReadTrendsDto::without_comparison(current));
        }

        let previous_by_id: HashMap<Uuid, f64> = previous
            .into_iter()
            .map(|r| (r.tracked_category_id, r.total_minutes))
            .collect();

        let mut trends: Vec<CategoryTrendDto> = current
            .into_iter()
            .map(|row| {
                let previous_minutes = previous_by_id.get(&row.tracked_category_id).copied().unwrap_or(0.0);
                let percent_change = if previous_minutes > 0.0 {
                    Some(((row.total_minutes - previous_minutes) / previous_minutes) * 100.0)
                } else if row.total_minutes > 0.0 {
                    None // "new" activity with no prior baseline — shown as "New" not "+inf%"
                } else {
                    Some(0.0)
                };
                CategoryTrendDto {
                    tracked_category_id: row.tracked_category_id,
                    name: row.name,
                    color: row.color,
                    current_minutes: row.total_minutes,
                    previous_minutes,
                    percent_change,
                }
            })
            .collect();

        trends.sort_by(|a, b| b.percent_change.unwrap_or(f64::MAX).total_cmp(&a.percent_change.unwrap_or(f64::MAX)));
        Ok(ReadTrendsDto { period, trends })
    }
}
```

### DTOs (`backend/src/dto/community_analytics.rs`)

```rust
#[derive(Clone, Serialize, Deserialize)]
pub struct CategoryDistributionDto {
    pub tracked_category_id: Uuid,
    pub name: String,
    pub color: String,
    pub total_minutes: f64,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadDistributionDto {
    pub period: AnalyticsPeriod,
    pub categories: Vec<CategoryDistributionDto>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct CategoryTrendDto {
    pub tracked_category_id: Uuid,
    pub name: String,
    pub color: String,
    pub current_minutes: f64,
    pub previous_minutes: f64,
    /// None when there's no meaningful baseline (brand-new activity, or
    /// AllTime period) — frontend renders "New" rather than a percentage.
    pub percent_change: Option<f64>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadTrendsDto {
    pub period: AnalyticsPeriod,
    pub trends: Vec<CategoryTrendDto>,
}

#[derive(Clone, Serialize, Deserialize, Validate)]
pub struct AnalyticsQueryDto {
    pub period: AnalyticsPeriod,
}
```

### Router

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:community_id/analytics/distribution` | `get_distribution_handler` | member of community, or public data if `data_visibility = public` | Category time distribution for a period. |
| GET | `/api/community/:community_id/analytics/trends` | `get_trends_handler` | same as above | Trending categories vs. previous equivalent period. |

```rust
#[instrument(skip(state), fields(community_id = %community_id, actor_id = %actor, period = ?query.period))]
async fn get_distribution_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    Query(query): Query<AnalyticsQueryDto>,
    actor: Actor,
) -> ApiResponse<ReadDistributionDto> {
    let result = state
        .community_analytics_service
        .get_distribution(&actor, community_id, query.period)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`api/definitions/models/community-analytics.ts`)

```ts
export const AnalyticsPeriodSchema = z.enum(["day", "week", "month", "all_time"]);

export const CategoryDistributionSchema = z.object({
  trackedCategoryId: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  totalMinutes: z.number(),
});

export const DistributionResponseSchema = z.object({
  period: AnalyticsPeriodSchema,
  categories: z.array(CategoryDistributionSchema),
});

export const CategoryTrendSchema = z.object({
  trackedCategoryId: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  currentMinutes: z.number(),
  previousMinutes: z.number(),
  percentChange: z.number().nullable(),
});

export const TrendsResponseSchema = z.object({
  period: AnalyticsPeriodSchema,
  trends: z.array(CategoryTrendSchema),
});

export type AnalyticsPeriod = z.infer<typeof AnalyticsPeriodSchema>;
export type CategoryDistribution = z.infer<typeof CategoryDistributionSchema>;
export type CategoryTrend = z.infer<typeof CategoryTrendSchema>;
```

### API Client (`api/communityAnalyticsApi.ts`)

```ts
export const getDistribution = async (params: CommunityAnalyticsRequest["getDistribution"]) => {
  const { data } = await baseApi.get(
    `/community/${params.communityId}/analytics/distribution`,
    { params: { period: params.period } },
  );
  return await parseResponseUnsafe(data, CommunityAnalyticsResponseSchema.getDistribution);
};

export const getTrends = async (params: CommunityAnalyticsRequest["getTrends"]) => {
  const { data } = await baseApi.get(
    `/community/${params.communityId}/analytics/trends`,
    { params: { period: params.period } },
  );
  return await parseResponseUnsafe(data, CommunityAnalyticsResponseSchema.getTrends);
};
```

### React Query Hooks (`components/hooks/community/useCommunityAnalytics.ts`)

- `useCommunityDistribution(communityId: string, period: AnalyticsPeriod)`
- `useCommunityTrends(communityId: string, period: AnalyticsPeriod)`

Both `useQuery` with `keepPreviousData` (matches `useTags`/leaderboard
period-switch pattern — switching periods shouldn't blank the chart while
refetching) and `staleTime: 60_000`.

`queryKeys.ts` additions:

```ts
const communityAnalyticsKeys = createQueryKeys("communityAnalytics", {
  distribution: (communityId: string, period: AnalyticsPeriod) => ({
    queryFn: async () => await CommunityAnalyticsApi.getDistribution({ communityId, period }),
    queryKey: [communityId, "distribution", period],
  }),
  trends: (communityId: string, period: AnalyticsPeriod) => ({
    queryFn: async () => await CommunityAnalyticsApi.getTrends({ communityId, period }),
    queryKey: [communityId, "trends", period],
  }),
});
```

### UI Components

- `components/community/analytics/AnalyticsPeriodSelector.tsx` — thin
  wrapper re-exporting/re-styling v2 step 4's leaderboard period control so
  both surfaces stay visually identical; not a new control.
- `components/community/analytics/CategoryDistributionChart.tsx` — donut
  chart (recharts `PieChart` + `Pie`, `innerRadius` set, directly modeled
  on `SessionPieChartUiProvider`: hover/tap-to-highlight a slice, center
  label showing total minutes when nothing is highlighted).
- `components/community/analytics/CategoryTrendChart.tsx` — horizontal bar
  chart (recharts `BarChart` with `layout="vertical"`), one bar per tracked
  category, bar length = `percentChange` (diverging: positive bars extend
  right in a "trending up" color, negative extend left in a "trending
  down" color — two-color diverging scale, not a single hue, so direction
  doesn't rely on bar length alone).
- `components/community/analytics/AnalyticsDataTable.tsx` — the
  accessible fallback: a plain `<table>` with columns Category / Minutes /
  % change, rendered for both charts (visually hidden by default behind a
  "View as table" toggle, always present in the DOM for screen readers —
  see Accessibility).

User journey:
1. Member opens the community's Analytics tab.
2. `AnalyticsPeriodSelector` defaults to "week"; `CategoryDistributionChart`
   and `CategoryTrendChart` both fetch for that period in parallel.
3. Changing the period re-fetches both charts together (shared period
   state lifted to the tab's parent), old data stays visible
   (`keepPreviousData`) with a subtle opacity dip while refetching.
4. Hovering/tapping a distribution slice highlights the same category in
   the trend chart (shared `activeCategoryId` state) so a member can see
   "this category is 40% of our time, and it's trending up 12%" as one
   connected fact, not two disjoint charts.

## UX & Polish

- **Loading state**: chart skeletons are literal chart-shaped placeholders
  — a grey donut ring for the distribution chart, grey horizontal bars of
  randomized-but-deterministic widths for the trend chart — not a generic
  spinner, so the layout doesn't jump and the shape hints at what's coming.
- **Empty state**: a community with tracked categories but zero mapped
  time in the selected period shows *"No tracked time yet for this
  period — try a longer period or check back once members start
  logging."* with the period selector still visible (so switching to
  "All-time" is one click away, not a dead end). A community with zero
  tracked categories at all (shouldn't happen post-v1 onboarding, but
  defensively) shows *"This community hasn't set up tracked categories
  yet."*
- **Error state**: toast — title `"Couldn't load analytics"`, description
  `"Something went wrong loading the analytics for this period. Try
  again."`, `variant: "destructive"`.
- **Optimistic/real-time feel**: not applicable — analytics are read-only
  aggregates, no user-initiated mutation to feel instant. Period switches
  feel instant via `keepPreviousData`, which is the relevant affordance
  here.
- **Responsive**: below `sm`, `CategoryTrendChart` and
  `CategoryDistributionChart` stack vertically (never side-by-side, which
  the desktop layout uses) and the trend chart's category labels truncate
  with a tooltip on tap rather than wrapping and blowing out row height.
- **Accessibility**: both charts ship an always-in-DOM
  `AnalyticsDataTable` (visually a `sr-only` toggle target, not
  `display:none`, so it's in the accessibility tree without needing JS to
  reveal it) summarizing the exact same numbers the chart shows. Bar/slice
  color is paired with a text data-label on hover/focus (not
  color-alone); the trend chart's up/down direction is additionally
  conveyed with a `▲`/`▼` glyph next to each percentage, not just bar
  color, satisfying "non-color-reliant" for the diverging scale.

## Acceptance Criteria

- [ ] `GET .../analytics/distribution?period=week` returns one row per
      tracked category, including categories with `totalMinutes: 0`.
- [ ] `GET .../analytics/trends?period=month` correctly compares against
      the prior calendar month of equal length, not a rolling 30 days vs.
      30 days (period boundaries match v2's leaderboard period semantics
      exactly, for consistency).
- [ ] A tracked category with activity in the current period but none in
      the previous period reports `percentChange: null`, not a divide-by-
      zero error or `Infinity`.
- [ ] `period=all_time` returns trends with every `percentChange: null`
      rather than attempting a comparison window.
- [ ] Distribution and trend charts both have a working, keyboard-
      reachable "View as table" toggle showing identical numbers to the
      chart.
- [ ] Switching periods does not blank the chart while the new period
      loads.

## Testing Notes

- Backend (`cargo test`):
  - `get_distribution_includes_zero_minute_tracked_categories`
  - `get_trends_percent_change_none_when_no_previous_period_activity`
  - `get_trends_percent_change_negative_when_activity_decreased`
  - `get_trends_all_time_returns_no_comparison`
  - `get_distribution_respects_data_visibility_members_only`
- Frontend (Storybook):
  - `CategoryDistributionChart.stories.tsx`: populated, all-zero (empty
    state), single category (100%), loading skeleton.
  - `CategoryTrendChart.stories.tsx`: mixed up/down, all "New" (no
    baseline), all-time (no comparison state), loading skeleton.
  - `AnalyticsDataTable.stories.tsx`: verifies table renders and matches
    fixture data used in the chart stories above (same fixtures, asserting
    parity is easy to keep true over time).
