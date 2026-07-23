# Step 1: Achievement Badges

> **Migration numbering assumption** (stated once here, holds for all five v3
> step files): `ls backend/migrations | sort -V | tail -1` currently shows
> `0056_add_user_id_to_metrics_handler.sql`, matching the number the
> top-level README recorded at plan time. Per that README, v1's four steps
> claim `0057`–`0060` and v2's five steps claim the next block, sized to
> `0061`–`0066` (one migration per step plus one spare for the invite-table
> migration off the v1 static code). v3 therefore starts at **`0067`**. This
> version's five step files consume the range `0067`–`0073`:
>
> | # | File | Migration(s) |
> |---|---|---|
> | 1 | `01-achievement-badges.md` | `0067`, `0068` |
> | 2 | `02-streaks.md` | `0069`, `0070` |
> | 3 | `03-analytics-distribution-and-trends.md` | `0071` |
> | 4 | `04-activity-heatmap-and-progress-comparison.md` | `0072` |
> | 5 | `05-community-activity-feed.md` | `0073` |
>
> As with every version, re-check `sort -V | tail -1` before cutting the real
> migration — this table is a planning-time reservation, not a guarantee.

## Overview

Members get a fixed, system-defined set of achievement badges tied to their
tracked time and activity inside one community. Badges recognize milestones
(hours logged, streaks reached, category mastery) and are awarded
automatically the moment a member crosses a threshold, then shown on their
member profile within the community and announced via the existing
notification system. This step depends on v1's `community_member` and
`community_category_mapping` (badge criteria are evaluated against a
member's *mapped* sessions only — time that doesn't count toward the
community dashboard doesn't count toward a badge either) and lays the
groundwork step 5 (activity feed) consumes: every award writes a
`community_activity_event` row.

## Scope

- In scope:
  - A fixed catalog of 8 system-defined badges (table below), seeded by
    migration, not creatable/editable through the API.
  - Automatic award-evaluation triggered after a session completes.
  - Idempotent awarding (a member can never receive the same badge twice).
  - Badge grid on the member's profile-within-community view, plus a compact
    badge strip on the member list row.
  - A notification on award, following the existing
    `NotificationType`/`NotificationService` pattern.
- Explicitly deferred:
  - **Custom/community-defined badges** — deferred indefinitely per the v3
    README; the fixed catalog is the entire badge system for the
    foreseeable future, not a v3-only placeholder.
  - **Rank-based badges** (e.g. "#1 on the monthly leaderboard") — would
    require evaluating at period close via a scheduled job rather than at
    session-completion time, which is a different execution model than the
    rest of this step. Left out to keep award-evaluation single-mechanism;
    revisit only if a scheduled-job infrastructure gets introduced for
    other reasons.
  - **Badge revocation** — no badge is ever removed once earned (matches the
    "your community history is yours" feel of the rest of the app); if a
    member's mapping is later deleted, previously earned badges stay.
  - **Per-community badge icons/branding** — icons are a fixed
    `lucide-react` icon name per badge code, not configurable.

## Data Model

### Migration 1: `backend/migrations/0067_create_community_badges.sql`

```sql
CREATE TYPE community_badge_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');

CREATE TYPE community_badge_criteria_type AS ENUM (
    'total_minutes',      -- lifetime tracked minutes mapped into the community
    'category_minutes',   -- minutes mapped into a single tracked category
    'streak_days',        -- current_streak_days from community_member_streak
    'active_days'         -- count of distinct active days, not necessarily consecutive
);

CREATE TABLE community_badge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,                 -- lucide-react icon name, see UI section
    tier community_badge_tier NOT NULL,
    criteria_type community_badge_criteria_type NOT NULL,
    criteria_threshold INTEGER NOT NULL, -- minutes or days, per criteria_type
    sort_order SMALLINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE community_member_badge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES community_badge(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (community_member_id, badge_id)
);

CREATE INDEX idx_community_member_badge_member ON community_member_badge(community_member_id);
CREATE INDEX idx_community_member_badge_badge ON community_member_badge(badge_id);

-- Fixed badge catalog. `criteria_threshold` unit matches criteria_type:
-- total_minutes/category_minutes -> minutes, streak_days/active_days -> days.
INSERT INTO community_badge (code, name, description, icon, tier, criteria_type, criteria_threshold, sort_order) VALUES
    ('first_session',       'Getting Started',    'Logged your first tracked session in this community.',                     'Sparkles',    'bronze',   'total_minutes',    1,    10),
    ('first_10_hours',      'First 10 Hours',     'Accumulated 10 hours of tracked time in this community.',                   'Clock',       'bronze',   'total_minutes',    600,  20),
    ('fifty_hours',         'Half Century',       'Accumulated 50 hours of tracked time in this community.',                   'Timer',       'silver',   'total_minutes',    3000, 30),
    ('hundred_hours',       'Centurion',          'Accumulated 100 hours of tracked time in this community.',                  'Award',       'gold',     'total_minutes',    6000, 40),
    ('streak_7',            '7-Day Streak',       'Tracked a session 7 days in a row in this community.',                      'Flame',       'bronze',   'streak_days',      7,    50),
    ('streak_30',           '30-Day Streak',      'Tracked a session 30 days in a row in this community.',                     'FlameKindling', 'gold',   'streak_days',      30,   60),
    ('category_mastery_50', 'Category Mastery',   'Logged 50 hours in a single tracked category in this community.',          'Target',      'silver',   'category_minutes', 3000, 70),
    ('consistent_contributor', 'Consistent Contributor', 'Active on 20 different days (not necessarily consecutive) in this community.', 'CalendarCheck', 'silver', 'active_days', 20, 80);
```

### Migration 2: `backend/migrations/0068_add_community_badge_notification_type.sql`

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:badge_awarded';
```

Kept as its own migration file, matching the existing convention of
isolating `ALTER TYPE ... ADD VALUE` statements (see `0051`, `0052`) so the
new enum value is committed before anything in a later migration could try
to use it in the same transaction.

### Rust entities (`backend/src/entity/community_badge.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_badge_tier", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum CommunityBadgeTier {
    Bronze,
    Silver,
    Gold,
    Platinum,
}

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_badge_criteria_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityBadgeCriteriaType {
    TotalMinutes,
    CategoryMinutes,
    StreakDays,
    ActiveDays,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommunityBadge {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub tier: CommunityBadgeTier,
    pub criteria_type: CommunityBadgeCriteriaType,
    pub criteria_threshold: i32,
    pub sort_order: i16,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommunityMemberBadge {
    pub id: Uuid,
    pub community_member_id: Uuid,
    pub badge_id: Uuid,
    pub awarded_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_badge.rs`)

```rust
pub struct CommunityBadgeRepository { db: Arc<Database> }

impl CommunityBadgeRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    /// The full fixed catalog, ordered by sort_order. Cheap and effectively
    /// static — callers may cache in-process if this becomes hot.
    pub async fn list_all_badges(&self) -> Result<Vec<CommunityBadge>>;

    /// Badges a specific member has already earned, newest first.
    pub async fn list_earned_badges(
        &self,
        community_member_id: Uuid,
    ) -> Result<Vec<(CommunityBadge, DateTime<Local>)>>;

    /// The member's lifetime tracked minutes mapped into this community,
    /// for `total_minutes` criteria evaluation.
    pub async fn get_member_total_mapped_minutes(
        &self,
        community_member_id: Uuid,
    ) -> Result<f64>;

    /// Per-tracked-category mapped minutes for this member, for
    /// `category_minutes` criteria evaluation. Returns the max so the
    /// service doesn't need to iterate every tracked category.
    pub async fn get_member_max_category_minutes(
        &self,
        community_member_id: Uuid,
    ) -> Result<f64>;

    /// Distinct calendar dates (see streak step for the date-basis caveat)
    /// on which the member has a mapped session, for `active_days` criteria.
    pub async fn get_member_active_day_count(
        &self,
        community_member_id: Uuid,
    ) -> Result<i64>;

    /// Idempotent award: INSERT ... ON CONFLICT (community_member_id,
    /// badge_id) DO NOTHING RETURNING id. Returns None if the member
    /// already had this badge (no-op, no duplicate award).
    pub async fn try_award_badge(
        &self,
        community_member_id: Uuid,
        badge_id: Uuid,
    ) -> Result<Option<CommunityMemberBadge>>;
}
```

`get_member_total_mapped_minutes` shape (the other two follow the same join
pattern against `community_category_mapping` → `session`):

```sql
SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60), 0)::float8
FROM community_category_mapping ccm
JOIN session s
    ON s.category_id = ccm.personal_category_id
   AND s.user_id = (SELECT user_id FROM community_member WHERE id = $1)
WHERE ccm.community_member_id = $1
  AND s.end_time IS NOT NULL
```

### Service (`backend/src/service/community_badge_service.rs`)

**When evaluation runs**: synchronously, fire-and-forget, immediately after
a session that could affect a mapped category finishes — i.e. at the end of
`FixedSessionService::create` (a fixed session always has `end_time` set)
and at the end of `StopwatchSessionService::finish` (the point a stopwatch
session gets an `end_time`). We do **not** run this as a scheduled/batch
job. Justification: badge thresholds are cheap, member-scoped aggregate
queries (three small `SUM`/`COUNT`s against one member's mapped sessions),
not a cross-community scan; running them eagerly gives the same
near-instant, "it just happened" feel the app already has for session
creation (see `useCreateStopwatchSession`'s optimistic update), and it
avoids introducing a new nightly-job execution model into a codebase that
doesn't have one yet. The cost is paid once per completed session, by the
member who just acted — never by other members' requests.

```rust
#[derive(Clone)]
pub struct CommunityBadgeService {
    repo: CommunityBadgeRepository,
    community_member_repo: CommunityMemberRepository, // from v1
    activity_event_service: CommunityActivityEventService, // from step 5
    notification_service: NotificationService,
}

impl CommunityBadgeService {
    /// Called from session-completion hooks. Looks up every
    /// community_category_mapping row for (user_id, category_id) — a
    /// session can map into more than one community if the user belongs to
    /// several communities that both track a category they've mapped to —
    /// and re-evaluates that member's badges in each one.
    #[instrument(err, skip(self), fields(user_id = %user_id, category_id = %category_id))]
    pub async fn evaluate_after_session_completed(
        &self,
        user_id: &str,
        category_id: Uuid,
    ) -> Result<()> {
        let affected_members = self
            .community_member_repo
            .list_members_by_mapped_category(user_id, category_id)
            .await?;

        for member in affected_members {
            self.evaluate_member_badges(member.id).await?;
        }
        Ok(())
    }

    /// Re-checks all 8 badge criteria for one member and awards any newly
    /// crossed ones. Safe to call repeatedly (idempotent via the DB unique
    /// constraint + ON CONFLICT DO NOTHING in the repo).
    #[instrument(err, skip(self), fields(community_member_id = %community_member_id))]
    pub async fn evaluate_member_badges(&self, community_member_id: Uuid) -> Result<Vec<CommunityBadge>> {
        let catalog = self.repo.list_all_badges().await?;
        let total_minutes = self.repo.get_member_total_mapped_minutes(community_member_id).await?;
        let max_category_minutes = self.repo.get_member_max_category_minutes(community_member_id).await?;
        let active_days = self.repo.get_member_active_day_count(community_member_id).await?;
        // current_streak_days read from community_member_streak (step 2);
        // 0 if the row doesn't exist yet.
        let streak_days = self.repo.get_member_current_streak_days(community_member_id).await?;

        let mut newly_awarded = Vec::new();
        for badge in catalog {
            let value = match badge.criteria_type {
                CommunityBadgeCriteriaType::TotalMinutes => total_minutes,
                CommunityBadgeCriteriaType::CategoryMinutes => max_category_minutes,
                CommunityBadgeCriteriaType::StreakDays => streak_days as f64,
                CommunityBadgeCriteriaType::ActiveDays => active_days as f64,
            };

            if value < badge.criteria_threshold as f64 {
                continue;
            }

            let Some(award) = self.repo.try_award_badge(community_member_id, badge.id).await? else {
                continue; // already earned, ON CONFLICT DO NOTHING short-circuited
            };

            self.activity_event_service
                .record_badge_awarded(community_member_id, &badge, award.awarded_at)
                .await?;
            self.notify_badge_awarded(community_member_id, &badge).await?;
            newly_awarded.push(badge);
        }
        Ok(newly_awarded)
    }
}
```

### DTOs (`backend/src/dto/community_badge.rs`)

```rust
#[derive(Clone, Serialize, Deserialize)]
pub struct ReadCommunityBadgeDto {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub description: String,
    pub icon: String,
    pub tier: CommunityBadgeTier,
    pub criteria_type: CommunityBadgeCriteriaType,
    pub criteria_threshold: i32,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ReadMemberBadgeDto {
    #[serde(flatten)]
    pub badge: ReadCommunityBadgeDto,
    pub awarded_at: DateTime<Local>,
}

/// One row per catalog badge, `earned` distinguishing owned vs locked so
/// the frontend can render the full grid (including un-earned badges,
/// greyed out) in a single request.
#[derive(Clone, Serialize, Deserialize)]
pub struct ReadMemberBadgeProgressDto {
    #[serde(flatten)]
    pub badge: ReadCommunityBadgeDto,
    pub earned: bool,
    pub awarded_at: Option<DateTime<Local>>,
    /// Current progress value in the badge's own unit (minutes or days),
    /// so the UI can render "32 / 50 hours" progress bars for locked badges.
    pub current_value: f64,
}
```

### Router

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:community_id/badges` | `list_community_badges_handler` | member of community (or public community data) | Full catalog, no per-member data. |
| GET | `/api/community/:community_id/members/:member_id/badges` | `list_member_badge_progress_handler` | member of community (respects `data_visibility`) | Catalog + this member's earned/locked/progress. |

```rust
#[instrument(skip(state), fields(community_id = %community_id, member_id = %member_id, actor_id = %actor))]
async fn list_member_badge_progress_handler(
    State(state): State<AppState>,
    Path((community_id, member_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<Vec<ReadMemberBadgeProgressDto>> {
    let result = state
        .community_badge_service
        .get_member_badge_progress(&actor, community_id, member_id)
        .await;
    ApiResponse::from_result(result)
}
```

The service call first re-uses v1's `data_visibility` check (same helper
the dashboard step already established: public communities allow any
authenticated actor, `members_only` communities require the actor to have a
`community_member` row) before returning progress data — badges are exposed
under exactly the same visibility rule as the rest of a member's
contribution.

## Frontend Implementation

### Types & Schemas (`api/definitions/models/community-badge.ts`)

```ts
import { z } from "zod";

export const CommunityBadgeTierSchema = z.enum(["bronze", "silver", "gold", "platinum"]);
export const CommunityBadgeCriteriaTypeSchema = z.enum([
  "total_minutes",
  "category_minutes",
  "streak_days",
  "active_days",
]);

export const CommunityBadgeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  tier: CommunityBadgeTierSchema,
  criteriaType: CommunityBadgeCriteriaTypeSchema,
  criteriaThreshold: z.number().int(),
});

export const MemberBadgeProgressSchema = CommunityBadgeSchema.extend({
  earned: z.boolean(),
  awardedAt: z.coerce.date<Date>().nullable(),
  currentValue: z.number(),
});

export type CommunityBadge = z.infer<typeof CommunityBadgeSchema>;
export type MemberBadgeProgress = z.infer<typeof MemberBadgeProgressSchema>;
```

### API Client (`api/communityBadgeApi.ts`)

```ts
export const listBadges = async (params: CommunityBadgeRequest["listBadges"]) => {
  const { data } = await baseApi.get(`/community/${params.communityId}/badges`);
  return await parseResponseUnsafe(data, CommunityBadgeResponseSchema.listBadges);
};

export const listMemberBadgeProgress = async (
  params: CommunityBadgeRequest["listMemberBadgeProgress"],
) => {
  const { data } = await baseApi.get(
    `/community/${params.communityId}/members/${params.memberId}/badges`,
  );
  return await parseResponseUnsafe(data, CommunityBadgeResponseSchema.listMemberBadgeProgress);
};
```

### React Query Hooks (`components/hooks/community/useCommunityMemberBadges.ts`)

- `useCommunityBadgeCatalog(communityId: string)` — `useQuery`, `staleTime: Infinity` (catalog is fixed, matches `useTags`'s treatment of near-static data).
- `useCommunityMemberBadgeProgress(communityId: string, memberId: string)` — `useQuery`, `staleTime: 60_000`.

`queryKeys.ts` additions:

```ts
const communityBadgeKeys = createQueryKeys("communityBadges", {
  catalog: (communityId: string) => ({
    queryFn: async () => await CommunityBadgeApi.listBadges({ communityId }),
    queryKey: [communityId, "catalog"],
  }),
  memberProgress: (communityId: string, memberId: string) => ({
    queryFn: async () =>
      await CommunityBadgeApi.listMemberBadgeProgress({ communityId, memberId }),
    queryKey: [communityId, memberId, "progress"],
  }),
});
```

### UI Components

- `components/community/badges/BadgeGrid.tsx` — renders the full catalog as
  a responsive grid of `BadgeTile`s (earned tiles full color, locked tiles
  desaturated with a progress bar).
- `components/community/badges/BadgeTile.tsx` — single badge: icon (mapped
  from `icon` string to a `lucide-react` component via a small lookup map),
  name, tier ring color, and either "Earned <relative date>" or a progress
  bar + "<current> / <threshold>".
- `components/community/badges/BadgeAwardToast.tsx` — the celebratory
  micro-interaction content (see UX section).
- `components/community/badges/BadgeTierBadge.tsx` — small tier chip (used
  inline in the member list next to a name), non-color-reliant (see
  Accessibility).

User journey:
1. Member opens a community they belong to, clicks a member row (their own
   or another's, subject to `data_visibility`) → member profile panel.
2. `BadgeGrid` fetches `useCommunityMemberBadgeProgress` and renders 8
   tiles: earned ones up top (sorted by `awardedAt` desc), locked ones below
   (sorted by `sortOrder`, i.e. catalog order) with progress bars.
3. When the member completes a session that crosses a threshold, the next
   time any community query refetches (or on the next visit) the badge
   flips from locked to earned; if the member is actively looking at the
   dashboard when it happens (near-real-time via the existing 60s
   `refetchInterval` pattern used by notifications), `BadgeAwardToast`
   fires from the unseen-notification stream.

## UX & Polish

- **Loading state**: `BadgeGrid` skeleton — 8 fixed-size rounded-square
  placeholders in the same grid layout (`grid-cols-2 sm:grid-cols-4`), not a
  spinner, so the layout doesn't jump when real data arrives.
- **Empty state**: not applicable to the catalog (always 8 badges) — the
  "empty" case is a member with 0 earned badges, which isn't a distinct
  empty state, just all 8 tiles rendered locked. First-run copy on the
  section header: *"No badges earned yet — log a session to start
  earning."*
- **Error state**: toast — title `"Couldn't load badges"`, description
  `"Something went wrong loading this member's badges. Try refreshing the
  page."`, `variant: "destructive"`.
- **Celebratory micro-interaction**: on badge award, `BadgeAwardToast`
  replaces the default plain-text toast body with the badge icon at 2x
  size inside a tier-colored ring plus a one-line CSS keyframe "pop + glow"
  (`scale(0.6)→scale(1.05)→scale(1)` over 400ms, `box-shadow` pulse in the
  tier color) — no confetti library, just the existing toast + a small
  keyframe animation already achievable with Tailwind's `animate-*`
  utilities. Copy: *"Badge earned: {name}"* / *"{description}"*.
- **Responsive**: `BadgeGrid` goes from 4 columns (desktop) → 2 columns
  (mobile, `sm:` breakpoint) rather than shrinking tiles to illegibility;
  tile min width 88px.
- **Accessibility**: each `BadgeTile` is a `<button>` (opens a detail
  popover with full description + progress) with
  `aria-label="{name}, {tier} tier, {earned ? 'earned' : 'locked'}"`. Tier
  is conveyed by the `BadgeTierBadge` text label ("Gold") in addition to
  ring color — never color alone. Locked tiles get `aria-disabled` styling
  but remain focusable (so screen reader users can still hear what's
  achievable). Progress bars use `role="progressbar"` with
  `aria-valuenow/min/max`.

## Acceptance Criteria

- [ ] The 8 badges in the table above exist as rows in `community_badge`
      after migration `0067` runs, with the exact `code` values listed.
- [ ] Completing a fixed session whose category is mapped into a community
      triggers badge evaluation for that member in that community only
      (not other communities the category isn't mapped into).
- [ ] A member who already has a badge never gets a second
      `community_member_badge` row for it, even if evaluation runs
      concurrently for the same member (verified by the unique constraint).
- [ ] `GET /api/community/:id/members/:member_id/badges` returns all 8
      catalog badges with `earned`/`currentValue` populated correctly,
      respecting `data_visibility` (403/empty for non-members of a
      `members_only` community).
- [ ] Awarding a badge creates exactly one `community_activity_event` row
      and one `notification` row (`community:badge_awarded`).
- [ ] Badge grid renders locked badges with an accurate progress bar
      (`current_value / criteria_threshold`).
- [ ] Keyboard-only navigation can reach and read every badge tile's state.

## Testing Notes

- Backend (`cargo test`):
  - `evaluate_member_badges_awards_first_session_badge_on_first_mapped_session`
  - `evaluate_member_badges_is_idempotent_when_called_twice_with_same_data`
    (asserts `try_award_badge` returns `None` the second time, no duplicate
    row, no duplicate notification).
  - `evaluate_member_badges_only_counts_mapped_categories` (a session in a
    personal category the member never mapped to this community must not
    count toward `total_minutes`).
  - `evaluate_member_badges_category_mastery_uses_max_not_sum_across_categories`
    (50h split across two different tracked categories should *not* award
    `category_mastery_50`).
  - `evaluate_after_session_completed_fans_out_to_every_community_the_category_is_mapped_into`.
- Frontend (Storybook):
  - `BadgeTile.stories.tsx`: earned (each tier), locked with 0% progress,
    locked near-threshold (e.g. 45/50h).
  - `BadgeGrid.stories.tsx`: full grid mixed earned/locked, loading skeleton,
    error state.
  - `BadgeAwardToast.stories.tsx`: one story per tier to check the glow
    color reads correctly in both light and dark theme.
