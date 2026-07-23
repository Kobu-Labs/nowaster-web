# Step 2: Streaks

## Overview

Every `community_member` gets a current and longest consecutive-day streak,
computed from their sessions mapped into the community's tracked
categories. Streaks give the community dashboard the "don't break the
chain" motivation loop, feed two of step 1's badges (`streak_7`,
`streak_30`), and emit milestone events step 5's activity feed consumes.
This step depends on v1's `community_category_mapping` for "what counts,"
and its award-adjacent notification follows the exact pattern step 1
established.

## Scope

- In scope:
  - `community_member_streak`: one row per member, `current_streak_days`,
    `longest_streak_days`, `last_active_date`.
  - Recomputation on every session that completes with a mapped category
    (mirrors step 1's trigger point).
  - Streak indicator UI: flame icon + day count on the dashboard member list
    and on the member's own profile-within-community header.
  - Milestone notification + activity-feed event at 7, 30, 100, and 365
    days.
- Explicitly deferred:
  - **Streak freezes / vacation mode** — no grace-day banking; missing a
    full calendar day resets the current streak. A freeze feature is a
    plausible v4 add-on, not decided here.
  - **Per-tracked-category streaks** — the streak is community-wide (any
    mapped tracked category counts), not one streak per category. Splitting
    it out would 8x the UI surface for a feature whose value (momentum,
    not precision) doesn't need that granularity.
  - **Cross-community combined streaks** — each community's streak is
    independent, matching the existing decision that categories, mappings,
    and now badges are all community-scoped via `community_member`.

## Data Model

### Migration 1: `backend/migrations/0069_create_community_member_streak.sql`

```sql
CREATE TABLE community_member_streak (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_member_id UUID NOT NULL UNIQUE REFERENCES community_member(id) ON DELETE CASCADE,
    current_streak_days INTEGER NOT NULL DEFAULT 0,
    longest_streak_days INTEGER NOT NULL DEFAULT 0,
    last_active_date DATE,
    streak_started_on DATE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_member_streak_member ON community_member_streak(community_member_id);
```

`community_member_id` is `UNIQUE` (not the PK directly) so the row can be
lazily created on first mapped session rather than needing a migration-time
backfill for every existing member — the repository does
`INSERT ... ON CONFLICT (community_member_id) DO UPDATE`.

### Migration 2: `backend/migrations/0070_add_community_streak_notification_type.sql`

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:streak_milestone';
```

### Rust entity (`backend/src/entity/community_member_streak.rs`)

```rust
use chrono::{DateTime, Local, NaiveDate};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommunityMemberStreak {
    pub id: Uuid,
    pub community_member_id: Uuid,
    pub current_streak_days: i32,
    pub longest_streak_days: i32,
    pub last_active_date: Option<NaiveDate>,
    pub streak_started_on: Option<NaiveDate>,
    pub updated_at: DateTime<Local>,
}
```

### The exact computation rule

**What counts as an "active day"**: a calendar date on which the member has
at least one session with `end_time IS NOT NULL` (i.e. completed — an
in-progress stopwatch session doesn't count until it's finished) whose
`category_id` matches a `community_category_mapping.personal_category_id`
row owned by that `community_member_id`. This is identical in shape to
step 1's `total_minutes` join, just counting distinct dates instead of
summing minutes.

**Timezone handling**: `session.start_time` is `TIMESTAMPTZ`
(`backend/migrations/0004_add_timezone_info.sql` converted it from a naive
`TIMESTAMP`), and the app-level type is `DateTime<Local>`
(`backend/src/entity/session.rs`). The existing personal streak
(`StatisticsRepository::get_current_streak`,
`backend/src/repository/statistics/sessions.rs`) computes "which day a
session belongs to" with `CAST(start_time AS DATE)`, which evaluates in the
Postgres *connection's* timezone setting, not any per-user timezone (the
schema has no per-user timezone column). **We deliberately inherit this
exact limitation for community streaks** rather than solving it here: a
member near midnight in a timezone that doesn't match the DB session
timezone can have a session attributed to the "wrong" calendar day, same as
their personal streak already can. Fixing this properly needs a
`user.timezone` column and touches the personal streak too — out of scope
for a community-scoped feature to fix unilaterally. This is a known,
pre-existing characteristic, not a new bug introduced by this step.

**Current streak semantics**: mirrors `get_current_streak`'s exact
recursive-CTE shape, including its quirk: the anchor day (`CURRENT_DATE`)
always contributes 1 to the count *even if the member has no session yet
today* — the chain only requires yesterday and every day before it to be
consecutively active. In practice this means: "how many days in a row
including today, generously counting today before it's over" — a member
who was active every day this week sees their streak number unchanged
until midnight passes without them logging anything, at which point the
next recompute (triggered by their next completed session) correctly drops
it. We keep this generous-today semantic on purpose, for consistency with
the personal streak the member already sees elsewhere in the app, rather
than introducing a stricter but inconsistent rule just for communities.

**Grace period**: none. Missing one full calendar day (no mapped session
logged at all) breaks the streak back to 1 on the next active day. No
streak-freeze tokens, no "still counts if within 36 hours" — a strict
calendar-day rule, matching the personal streak.

**Why full recomputation instead of an incremental counter**: sessions can
be created or edited with an arbitrary `start_time` (backfilled entries,
corrected times), not only "now." An incremental `current += 1` /
`current = 1` counter driven purely by "did the newest session's date equal
yesterday's `last_active_date` + 1" would silently corrupt itself the
moment someone logs (or edits) a session for a past date out of
chronological order. Recomputing directly from the mapped-session history
on every trigger — the same recursive-CTE pattern already reviewed and
shipped for personal streaks — is simple, correct under edits/backfills,
and keeps the community version structurally identical to code that
already exists, rather than inventing a new incremental-update algorithm
this codebase has no precedent for.

**Current streak SQL** (parameterized by `community_member_id`, joined
through the mapping the same way step 1's minute sums are):

```sql
WITH RECURSIVE consecutive_days AS (
    SELECT CAST(CURRENT_DATE AS DATE) AS date_day, 1 AS consecutive_count
    UNION ALL
    SELECT CAST(date_day - INTERVAL '1 day' AS DATE), consecutive_count + 1
    FROM consecutive_days
    WHERE EXISTS (
        SELECT 1
        FROM community_category_mapping ccm
        JOIN session s ON s.category_id = ccm.personal_category_id
        WHERE ccm.community_member_id = $1
          AND s.user_id = $2
          AND s.end_time IS NOT NULL
          AND CAST(s.start_time AS DATE) = date_day - INTERVAL '1 day'
    )
)
SELECT MAX(consecutive_count) AS current_streak_days FROM consecutive_days;
```

**Longest streak SQL** (a true gaps-and-islands scan over full history —
run less often than the current-streak query since it only needs updating
when the current streak *exceeds* the stored longest):

```sql
WITH active_days AS (
    SELECT DISTINCT CAST(s.start_time AS DATE) AS active_date
    FROM community_category_mapping ccm
    JOIN session s ON s.category_id = ccm.personal_category_id
    WHERE ccm.community_member_id = $1
      AND s.user_id = $2
      AND s.end_time IS NOT NULL
),
grouped AS (
    SELECT
        active_date,
        active_date - (ROW_NUMBER() OVER (ORDER BY active_date))::int AS island
    FROM active_days
)
SELECT COALESCE(MAX(run_length), 0) AS longest_streak_days
FROM (SELECT COUNT(*) AS run_length FROM grouped GROUP BY island) runs;
```

## Backend Implementation

### Repository (`backend/src/repository/community_member_streak.rs`)

```rust
pub struct CommunityMemberStreakRepository { db: Arc<Database> }

impl CommunityMemberStreakRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn get_by_member(
        &self,
        community_member_id: Uuid,
    ) -> Result<Option<CommunityMemberStreak>>;

    /// Runs the current-streak CTE above.
    async fn compute_current_streak_days(
        &self,
        community_member_id: Uuid,
        user_id: &str,
    ) -> Result<i32>;

    /// Runs the gaps-and-islands longest-streak query above.
    async fn compute_longest_streak_days(
        &self,
        community_member_id: Uuid,
        user_id: &str,
    ) -> Result<i32>;

    /// Recomputes both values and upserts the row. Returns the streak
    /// before and after the update so the service can detect a milestone
    /// crossing without a second read.
    pub async fn recompute_and_upsert(
        &self,
        community_member_id: Uuid,
        user_id: &str,
    ) -> Result<(CommunityMemberStreak, CommunityMemberStreak /* previous */)>;
}
```

`recompute_and_upsert` SQL shape:

```sql
INSERT INTO community_member_streak
    (community_member_id, current_streak_days, longest_streak_days, last_active_date, streak_started_on, updated_at)
VALUES ($1, $2, GREATEST($2, $3), CURRENT_DATE, CURRENT_DATE - ($2 - 1) * INTERVAL '1 day', NOW())
ON CONFLICT (community_member_id) DO UPDATE SET
    current_streak_days = EXCLUDED.current_streak_days,
    longest_streak_days = GREATEST(community_member_streak.longest_streak_days, EXCLUDED.current_streak_days),
    last_active_date = EXCLUDED.last_active_date,
    streak_started_on = CASE
        WHEN EXCLUDED.current_streak_days > community_member_streak.current_streak_days
             AND community_member_streak.last_active_date < CURRENT_DATE - INTERVAL '1 day'
        THEN EXCLUDED.streak_started_on  -- streak had broken, restart the anchor
        ELSE community_member_streak.streak_started_on
    END,
    updated_at = NOW()
RETURNING *;
```

(Exact CASE logic is an implementation detail for whoever builds this; the
essential invariant to preserve is "`longest_streak_days` only ever grows.")

### Service (`backend/src/service/community_streak_service.rs`)

**Update logic on new/completed session**: hooks into the exact same two
call sites as step 1 (`FixedSessionService::create`,
`StopwatchSessionService::finish`), and additionally the session *update*
path (`FixedSessionService::update`) when `start_time`/`end_time`/
`category_id` change, since a streak-affecting edit must trigger a
recompute the same as a new session would.

```rust
#[derive(Clone)]
pub struct CommunityStreakService {
    repo: CommunityMemberStreakRepository,
    community_member_repo: CommunityMemberRepository,
    community_badge_service: CommunityBadgeService, // step 1, re-evaluate streak badges
    activity_event_service: CommunityActivityEventService, // step 5
    notification_service: NotificationService,
}

const MILESTONE_DAYS: [i32; 4] = [7, 30, 100, 365];

impl CommunityStreakService {
    #[instrument(err, skip(self), fields(user_id = %user_id, category_id = %category_id))]
    pub async fn recompute_after_session_completed(
        &self,
        user_id: &str,
        category_id: Uuid,
    ) -> Result<()> {
        let affected_members = self
            .community_member_repo
            .list_members_by_mapped_category(user_id, category_id)
            .await?;

        for member in affected_members {
            let (updated, previous) = self
                .repo
                .recompute_and_upsert(member.id, user_id)
                .await?;

            if MILESTONE_DAYS.contains(&updated.current_streak_days)
                && updated.current_streak_days != previous.current_streak_days
            {
                self.activity_event_service
                    .record_streak_milestone(member.id, updated.current_streak_days)
                    .await?;
                self.notify_streak_milestone(member.id, updated.current_streak_days).await?;
            }

            // A streak crossing 7 or 30 may also newly satisfy a badge;
            // re-run badge evaluation for this member so streak_7/streak_30
            // are awarded in the same request that crossed the threshold.
            self.community_badge_service.evaluate_member_badges(member.id).await?;
        }
        Ok(())
    }
}
```

### DTOs (`backend/src/dto/community_member_streak.rs`)

```rust
#[derive(Clone, Serialize, Deserialize)]
pub struct ReadCommunityMemberStreakDto {
    pub community_member_id: Uuid,
    pub current_streak_days: i32,
    pub longest_streak_days: i32,
    pub last_active_date: Option<NaiveDate>,
    /// True if last_active_date is today or yesterday — lets the frontend
    /// show "at risk" styling without duplicating the date-math client-side.
    pub is_active_today_or_grace: bool,
}
```

### Router

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:community_id/members/:member_id/streak` | `get_member_streak_handler` | member of community (respects `data_visibility`) | Current + longest streak for one member. |

```rust
#[instrument(skip(state), fields(community_id = %community_id, member_id = %member_id, actor_id = %actor))]
async fn get_member_streak_handler(
    State(state): State<AppState>,
    Path((community_id, member_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<ReadCommunityMemberStreakDto> {
    let result = state
        .community_streak_service
        .get_member_streak(&actor, community_id, member_id)
        .await;
    ApiResponse::from_result(result)
}
```

The dashboard member list (v1 step 4) is extended to embed each member's
`current_streak_days` directly in its existing list response rather than
requiring N+1 calls to this endpoint — this dedicated endpoint exists for
the member-profile deep view where longest streak and the "at risk" flag
are also needed.

## Frontend Implementation

### Types & Schemas (`api/definitions/models/community-streak.ts`)

```ts
export const CommunityMemberStreakSchema = z.object({
  communityMemberId: z.string().uuid(),
  currentStreakDays: z.number().int().min(0),
  longestStreakDays: z.number().int().min(0),
  lastActiveDate: z.coerce.date<Date>().nullable(),
  isActiveTodayOrGrace: z.boolean(),
});

export type CommunityMemberStreak = z.infer<typeof CommunityMemberStreakSchema>;
```

### API Client (`api/communityStreakApi.ts`)

```ts
export const getMemberStreak = async (params: CommunityStreakRequest["getMemberStreak"]) => {
  const { data } = await baseApi.get(
    `/community/${params.communityId}/members/${params.memberId}/streak`,
  );
  return await parseResponseUnsafe(data, CommunityStreakResponseSchema.getMemberStreak);
};
```

### React Query Hooks

- `useCommunityMemberStreak(communityId: string, memberId: string)` —
  `useQuery`, `staleTime: 60_000`.

`queryKeys.ts` addition:

```ts
const communityStreakKeys = createQueryKeys("communityStreaks", {
  member: (communityId: string, memberId: string) => ({
    queryFn: async () => await CommunityStreakApi.getMemberStreak({ communityId, memberId }),
    queryKey: [communityId, memberId],
  }),
});
```

### UI Components

- `components/community/streaks/StreakIndicator.tsx` — flame icon + number,
  used inline in the member list row (compact) and expanded on the member
  profile header (with "longest: N days" secondary line).
- `components/community/streaks/StreakAtRiskBanner.tsx` — shown on the
  member's *own* profile only, when `isActiveTodayOrGrace` is false-leaning
  (last active yesterday, nothing logged yet today): *"Your {N}-day streak
  ends at midnight — log a session to keep it going."*

User journey:
1. Member list row shows `StreakIndicator` compact form next to each
   member's name/contribution, sourced from the extended v1 dashboard
   response (no extra request).
2. Clicking into a member's profile shows the expanded `StreakIndicator`
   plus (member viewing their own profile only) `StreakAtRiskBanner` if
   applicable.
3. On completing a session, the member's own streak number updates on next
   refetch; if it crosses 7/30/100/365 the milestone toast (styled like
   step 1's `BadgeAwardToast` but flame-themed) fires from the
   notification stream.

## UX & Polish

- **Loading state**: `StreakIndicator` skeleton is a flame-shaped grey
  placeholder (a simple rounded shape, not literally flame-outlined) plus a
  text-line skeleton for the number — sized to prevent layout shift in the
  member list row.
- **Empty state**: a member with no streak row yet (never logged a mapped
  session) shows `StreakIndicator` as "—" with muted styling and a tooltip
  *"No streak yet — log a session in a tracked category to start one."*
  rather than "0 days", since "0" reads as "you had one and lost it."
- **Error state**: toast — title `"Couldn't load streak"`, description
  `"Something went wrong loading streak data. Try again shortly."`,
  `variant: "destructive"`.
- **Celebratory micro-interaction**: milestone toast reuses step 1's
  pop+glow keyframe with a flame-orange ring regardless of tier (streaks
  don't have tiers), copy: *"{N}-day streak!"* / *"You've tracked time in
  this community {N} days in a row."*
- **Responsive**: compact `StreakIndicator` in the mobile member list drops
  the "longest" secondary line entirely (shown only on the profile page,
  which has room); the flame + number stays inline with the member's name,
  never wraps to its own row.
- **Accessibility**: `StreakIndicator` has
  `aria-label="{current}-day current streak, {longest}-day longest streak"`
  so screen reader users get both numbers even though only the current one
  is visually emphasized. `StreakAtRiskBanner` uses `role="status"` (not
  `alert`, since it's informational, not an error) so it's announced once
  without interrupting.

## Acceptance Criteria

- [ ] A member's first mapped session creates a `community_member_streak`
      row with `current_streak_days = 1`.
- [ ] Logging a mapped session on each of 7 consecutive calendar days sets
      `current_streak_days = 7` and awards the `streak_7` badge from step 1
      in the same request that crosses the threshold.
- [ ] Skipping a full calendar day resets `current_streak_days` to `1` on
      the next mapped session, while `longest_streak_days` is unaffected if
      it was already higher.
- [ ] Editing a session's `start_time` to a past date correctly
      recomputes both current and longest streak (not just increments).
- [ ] A streak crossing 7/30/100/365 emits exactly one
      `community_activity_event` and one `community:streak_milestone`
      notification, not one per session on that day.
- [ ] `GET .../streak` respects `data_visibility` identically to the
      badges endpoint.

## Testing Notes

- Backend (`cargo test`):
  - `recompute_streak_first_mapped_session_sets_current_to_one`
  - `recompute_streak_seven_consecutive_days_reaches_seven_and_stays_correct_on_eighth_day_before_logging`
    (asserts the "generous today" semantic: streak doesn't drop just
    because today hasn't been logged yet).
  - `recompute_streak_missed_day_resets_current_but_preserves_longest`
  - `recompute_streak_midnight_boundary` — a session with `start_time` at
    `23:59:59` and another the next calendar day at `00:00:01` (DB
    timezone) count as two different active days, not one, even though
    they're two minutes apart.
  - `recompute_streak_backfilled_past_session_recomputes_correctly_not_incrementally`
    (create day 1, day 2, day 4 sessions in that order — after day 4, current
    streak must correctly be 1, not 3, since day 3 was skipped).
  - `recompute_streak_milestone_notification_fires_once_not_per_session`
    (two sessions on the day the streak hits 7 must produce one milestone
    event, not two).
  - `recompute_streak_unmapped_category_session_does_not_count`.
- Frontend (Storybook):
  - `StreakIndicator.stories.tsx`: no streak, active streak, "at risk"
    (yesterday only), compact vs. expanded variants.
  - `StreakAtRiskBanner.stories.tsx`: default state, and confirm it does
    *not* render when `isActiveTodayOrGrace` is true.
