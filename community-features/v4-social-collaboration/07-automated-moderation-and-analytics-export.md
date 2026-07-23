# Step 7: Automated Moderation and Analytics Export

## Overview

Closes out v4 with two admin-facing tools: **automated moderation**, which
flags implausible time entries contributing to a community's aggregate for
owner/manager review (without ever editing or deleting a member's personal
session — communities can only flag, never touch, personal data), and
**analytics export**, a CSV/JSON dump of a community's aggregate data.
Depends on `community_category_mapping` (v1, defines which sessions count
toward a community) and the v1 aggregation query (extended here to exclude
actioned-flagged sessions).

## Scope

- In scope:
  - Automatic flagging via a scheduled scan job (not a real-time trigger —
    sessions aren't community-aware at creation time, so a session can
    only be evaluated for community-relevance after the fact by joining
    through `community_category_mapping`) using two concrete heuristics:
    1. **Implausible duration**: a single mapped session longer than a
       hard global ceiling of **12 hours**, OR longer than the
       community's own configurable `max_plausible_session_hours` (new
       nullable column on `community`, defaults `NULL` = only the global
       12h ceiling applies).
    2. **Excessive daily total**: a member's mapped sessions sum to more
       than **16 hours** of tracked time on a single calendar day within
       one community.
  - Manual flagging: any member can report a specific session as
    suspicious (`flag_type = 'manual_report'`) with a short reason —
    surfaces the same way an auto-flag does, for manager review.
  - Manager/owner review queue: dismiss a flag (no effect on aggregates) or
    action it (excludes that session from the community's aggregate
    calculations going forward — the underlying personal session is
    completely untouched, only the community-side aggregate query filters
    it out).
  - Analytics export: CSV or JSON, manager/owner only, of the community's
    current aggregate — per-member totals, per-tracked-category
    breakdown, generated on demand (no scheduled/emailed exports in v4).
- Explicitly deferred / out of scope:
  - Any modification, deletion, or "correction" of a member's personal
    session data by a community — flags only ever affect community-side
    aggregation, never the member's own session record, full stop. This is
    a hard boundary, not a v4-vs-later scoping choice: communities do not
    own member data.
  - Real-time flagging at session-creation time (would require sessions to
    know about community mappings at write time, coupling the core session
    write path to the community feature — architecturally wrong direction;
    the scan job runs against existing data instead).
  - Configurable/custom heuristics beyond the two above (a manager-tunable
    rules engine is disproportionate to a v4 slice — the two thresholds
    are fixed constants except for the one exposed knob,
    `max_plausible_session_hours`).
  - Scheduled/recurring exports, email delivery of exports — on-demand
    download only.
  - Exporting individual member session-level detail — export is aggregate
    only (per-member totals and per-category breakdown), never a raw
    session dump, to avoid the export becoming a backdoor around
    `data_visibility`.

## Data Model

Migration filename: `backend/migrations/0089_create_community_flag_table.sql`

```sql
ALTER TABLE community
ADD COLUMN max_plausible_session_hours SMALLINT NULL CHECK (max_plausible_session_hours IS NULL OR max_plausible_session_hours > 0);

CREATE TYPE community_flag_type AS ENUM (
    'implausible_duration',
    'excessive_daily_total',
    'manual_report'
);

CREATE TYPE community_flag_status AS ENUM (
    'pending',
    'dismissed',
    'actioned'
);

CREATE TABLE community_flag (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
    flagged_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    flag_type community_flag_type NOT NULL,
    auto_generated BOOLEAN NOT NULL DEFAULT TRUE,
    reported_by_member_id UUID NULL REFERENCES community_member(id) ON DELETE SET NULL, -- set for manual_report, null for auto-generated
    reason TEXT NULL CHECK (reason IS NULL OR char_length(reason) <= 1000),

    status community_flag_status NOT NULL DEFAULT 'pending',
    excluded_from_aggregate BOOLEAN NOT NULL DEFAULT FALSE, -- set true when actioned
    reviewed_by_member_id UUID NULL REFERENCES community_member(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_manual_report_has_reporter CHECK (
        (flag_type = 'manual_report' AND reported_by_member_id IS NOT NULL AND auto_generated = FALSE)
        OR
        (flag_type <> 'manual_report' AND auto_generated = TRUE)
    )
);

-- Prevents the scan job from inserting duplicate pending auto-flags for the
-- same session/type pair on every run.
CREATE UNIQUE INDEX uq_community_flag_pending_auto
    ON community_flag(community_id, session_id, flag_type)
    WHERE status = 'pending' AND auto_generated = TRUE;

CREATE INDEX idx_community_flag_review_queue
    ON community_flag(community_id, status, created_at DESC);

-- Backs the aggregation query's exclusion filter.
CREATE INDEX idx_community_flag_excluded_sessions
    ON community_flag(community_id, session_id)
    WHERE excluded_from_aggregate = TRUE;
```

Migration filename: `backend/migrations/0090_add_moderation_notification_types.sql`

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:flag_raised';
```

(Sent to managers/owners when a *manual* report comes in — auto-generated
flags don't interrupt anyone individually since the review queue itself is
the surface for those; a human reporting something suspicious about another
member is the case worth a push notification.)

### Rust entities (`backend/src/entity/community_flag.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_flag_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum FlagType {
    ImplausibleDuration,
    ExcessiveDailyTotal,
    ManualReport,
}

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_flag_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum FlagStatus {
    Pending,
    Dismissed,
    Actioned,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityFlag {
    pub id: Uuid,
    pub community_id: Uuid,
    pub session_id: Uuid,
    pub flagged_member_id: Uuid,
    pub flag_type: FlagType,
    pub auto_generated: bool,
    pub reported_by_member_id: Option<Uuid>,
    pub reason: Option<String>,
    pub status: FlagStatus,
    pub excluded_from_aggregate: bool,
    pub created_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_flag.rs`, `backend/src/repository/community_export.rs`)

```rust
pub struct CommunityFlagRepository { db: Arc<Database> }

impl CommunityFlagRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    // Scan-job entry points; each returns candidate (member_id, session_id) pairs
    // that violate the heuristic and don't already have a pending auto-flag
    // (dedup handled by the caller via the partial unique index / ON CONFLICT DO NOTHING).
    pub async fn find_implausible_duration_candidates(&self, community_id: Uuid, global_ceiling_hours: i32) -> Result<Vec<FlagCandidateDto>>;
    pub async fn find_excessive_daily_total_candidates(&self, community_id: Uuid, daily_ceiling_hours: i32) -> Result<Vec<FlagCandidateDto>>;
    pub async fn insert_auto_flag(&self, community_id: Uuid, candidate: FlagCandidateDto, flag_type: FlagType) -> Result<Option<CommunityFlag>>; // None if ON CONFLICT DO NOTHING skipped it

    pub async fn create_manual_report(&self, community_id: Uuid, reported_by_member_id: Uuid, dto: CreateManualReportDto) -> Result<CommunityFlag>;
    pub async fn list_queue(&self, community_id: Uuid, status: Option<FlagStatus>) -> Result<Vec<FlagWithContextDto>>;
    pub async fn dismiss(&self, flag_id: Uuid, reviewed_by_member_id: Uuid) -> Result<CommunityFlag>;
    pub async fn action(&self, flag_id: Uuid, reviewed_by_member_id: Uuid) -> Result<CommunityFlag>; // sets excluded_from_aggregate = true
}

pub struct CommunityExportRepository { db: Arc<Database> }

impl CommunityExportRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    // Reuses the v1 aggregation query's join shape, adding a NOT EXISTS
    // against community_flag WHERE excluded_from_aggregate = true.
    pub async fn get_export_data(&self, community_id: Uuid, period: ExportPeriod) -> Result<CommunityExportDto>;
}
```

### Service (`backend/src/service/community_moderation_service.rs`)

- **Scan job** (`run_moderation_scan`, invoked on the same scheduled-task
  mechanism as the calendar reminder job — e.g. hourly): for every active
  community, runs both candidate queries and inserts an auto-flag per
  candidate via `ON CONFLICT (community_id, session_id, flag_type) WHERE
  status = 'pending' AND auto_generated DO NOTHING`, so re-running the scan
  never double-flags a session already pending review. A session that was
  previously `dismissed` for the same `flag_type` **is** eligible to be
  re-flagged if it matches again on a later scan (e.g. the community
  lowered its `max_plausible_session_hours` after the dismissal) — the
  partial unique index only covers `status = 'pending'` rows, so a new
  `pending` row can coexist with an old `dismissed` one for the same
  session/type pair, and the review queue shows both as separate history.
- **Implausible duration heuristic, concretely**: for each session mapped
  into the community via `community_category_mapping`, compute
  `end_time - start_time`; flag if that duration exceeds
  `GREATEST(12 hours, community.max_plausible_session_hours)` — i.e. a
  community can only *loosen* the threshold above the 12h floor via
  `max_plausible_session_hours`, never tighten it below 12h (12h is
  already generous; a community wanting stricter flagging isn't a
  supported v4 use case, keeps the rule simple).

  Correction from a strict reading of "defaults NULL = only 12h applies":
  when `max_plausible_session_hours IS NULL`, the effective ceiling is
  exactly `12`; when set, the effective ceiling is
  `GREATEST(12, max_plausible_session_hours)`.
- **Excessive daily total heuristic, concretely**: group each member's
  community-mapped sessions by `date_trunc('day', start_time)` in the
  member's stored timezone (per `backend/migrations/0004_add_timezone_info.sql`'s
  existing timezone handling — reuse whatever column that migration adds
  rather than assuming UTC), sum durations per day; flag the *day's total*
  by flagging the single longest session that day that pushes the sum over
  16 hours (flags one representative session per violating day, not every
  session that day, so a manager reviews one row per incident rather than
  N).
- **Manual report**: any member of `community_id` may report any session
  visible to them within the community (i.e. a session that shows up in
  the community's own member-contribution view, respecting
  `data_visibility` — a member can't report a session they couldn't
  otherwise see). Requires a `reason` (non-empty, unlike auto-flags which
  have no `reason`). Notifies all managers/owners with
  `community:flag_raised`.
- **Dismiss**: manager/owner only. Sets `status = 'dismissed'`,
  `reviewed_by_member_id`, `reviewed_at`. No effect on aggregation.
- **Action**: manager/owner only. Sets `status = 'actioned'`,
  `excluded_from_aggregate = true`, `reviewed_by_member_id`,
  `reviewed_at`. From this point the v1 aggregation query (extended, see
  below) excludes this session from the community's totals, leaderboard,
  and any v3 analytics that depend on it. The member's own personal
  session, statistics, and category totals are completely unaffected —
  this is purely a community-side aggregate exclusion.
- **v1 aggregation query extension** (documented here since it's the one
  place this step modifies a prior version's query rather than adding a
  new one): every place v1/v2/v3 sum community-mapped session time must
  add `AND NOT EXISTS (SELECT 1 FROM community_flag cf WHERE cf.session_id
  = session.id AND cf.community_id = :community_id AND
  cf.excluded_from_aggregate = true)` to its `WHERE` clause. This is the
  single integration point v4's moderation step requires from earlier
  versions' code.

### Service (`backend/src/service/community_export_service.rs`)

- **Export**: manager/owner only (aggregate export can reveal per-member
  numbers that a `members_only` community wouldn't otherwise show to a
  non-member, and even within a `members_only` community, exporting is a
  bulk-extraction action gated a level above viewing the dashboard).
  `period` is one of `all_time`, `this_month`, `last_30_days`, or an
  explicit `{ from, to }` range — same period-selector shape as v2's
  leaderboard/v3's analytics dashboard, reused for consistency rather than
  inventing a new period concept.
  - **CSV fields**: `member_username`, `total_minutes`, one column per
    tracked category (`category_<name>_minutes`), `rank` (by
    `total_minutes` descending). Streamed as a single in-memory `String`
    built with a `csv::Writer` into a `Vec<u8>` buffer — community member
    counts are small enough (per v1's stated non-scale-optimized stance)
    that in-memory generation is fine, matching how `db_backup` doesn't
    stream either.
  - **JSON fields**: `{ community_id, community_name, period, generated_at,
    members: [{ user_id, username, total_minutes, category_breakdown:
    { [category_name]: minutes }, rank }] }`.

### DTOs

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateManualReportDto {
    pub session_id: Uuid,
    #[validate(length(min = 1, max = 1000))]
    pub reason: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct FlagWithContextDto {
    pub id: Uuid,
    pub flagged_member: ReadUserDto,
    pub session_id: Uuid,
    pub session_start_time: DateTime<Local>,
    pub session_end_time: DateTime<Local>,
    pub session_category_name: String,
    pub flag_type: FlagType,
    pub auto_generated: bool,
    pub reported_by: Option<ReadUserDto>,
    pub reason: Option<String>,
    pub status: FlagStatus,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ExportPeriod {
    AllTime,
    ThisMonth,
    Last30Days,
    Custom { from: DateTime<Local>, to: DateTime<Local> },
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct RequestExportDto {
    pub period: ExportPeriod,
    pub format: ExportFormat,
}

#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ExportFormat { Csv, Json }

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityExportDto {
    pub community_id: Uuid,
    pub community_name: String,
    pub period: ExportPeriod,
    pub generated_at: DateTime<Local>,
    pub members: Vec<MemberExportRowDto>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MemberExportRowDto {
    pub user_id: String,
    pub username: String,
    pub total_minutes: i64,
    pub category_breakdown: std::collections::BTreeMap<String, i64>,
    pub rank: i32,
}
```

### Router (`backend/src/router/community/moderation.rs`, `backend/src/router/community/export.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/community/:id/flags/report` | `create_manual_report_handler` | member | Report a session |
| GET | `/api/community/:id/flags?status=` | `list_flag_queue_handler` | manager/owner | Review queue |
| PATCH | `/api/community/:id/flags/:flag_id/dismiss` | `dismiss_flag_handler` | manager/owner | Dismiss |
| PATCH | `/api/community/:id/flags/:flag_id/action` | `action_flag_handler` | manager/owner | Action (exclude from aggregate) |
| GET | `/api/community/:id/export?format=csv\|json&period=` | `export_handler` | manager/owner | Download export |

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, community_id = %community_id, flag_id = %flag_id))]
async fn action_flag_handler(
    State(state): State<AppState>,
    Path((community_id, flag_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<CommunityFlag> {
    let result = state
        .community_moderation_service
        .action_flag(community_id, flag_id, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

The export handler returns the raw file rather than the standard
`ApiResponse<T>` JSON envelope, since it needs to set
`Content-Disposition: attachment; filename="..."` and a
format-appropriate `Content-Type` (`text/csv` or `application/json`):

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, community_id = %community_id))]
async fn export_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    Query(params): Query<RequestExportDto>,
    actor: Actor,
) -> impl IntoResponse {
    let data = state
        .community_export_service
        .generate_export(community_id, params.period, &actor)
        .await;

    match data {
        Ok(export) => match params.format {
            ExportFormat::Csv => {
                let csv_bytes = community_export_service::to_csv_bytes(&export);
                (
                    [
                        (header::CONTENT_TYPE, "text/csv"),
                        (header::CONTENT_DISPOSITION, "attachment; filename=\"community-export.csv\""),
                    ],
                    csv_bytes,
                )
                    .into_response()
            }
            ExportFormat::Json => axum::Json(export).into_response(),
        },
        Err(e) => ApiResponse::<()>::Error { message: e.to_string() }.into_response(),
    }
}
```

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/{communityFlag,communityExport}.ts`)

```ts
export const FlagTypeSchema = z.enum(["implausible_duration", "excessive_daily_total", "manual_report"]);
export const FlagStatusSchema = z.enum(["pending", "dismissed", "actioned"]);

export const CommunityFlagSchema = z.object({
  id: z.string().uuid(),
  flagged_member: ReadUserSchema,
  session_id: z.string().uuid(),
  session_start_time: z.coerce.date<Date>(),
  session_end_time: z.coerce.date<Date>(),
  session_category_name: z.string(),
  flag_type: FlagTypeSchema,
  auto_generated: z.boolean(),
  reported_by: ReadUserSchema.nullable(),
  reason: z.string().max(1000).nullable(),
  status: FlagStatusSchema,
  created_at: z.coerce.date<Date>(),
});
export type CommunityFlag = z.infer<typeof CommunityFlagSchema>;

const createManualReport = z.object({
  session_id: z.string().uuid(),
  reason: z.string().trim().min(1, "Explain what looks off").max(1000),
});

export const CommunityFlagRequestSchema = { createManualReport };

export const ExportPeriodSchema = z.enum(["all_time", "this_month", "last_30_days"]); // custom range handled as a separate optional {from,to} pair in the request
export const ExportFormatSchema = z.enum(["csv", "json"]);

export const CommunityExportRequestSchema = {
  request: z.object({
    period: ExportPeriodSchema,
    format: ExportFormatSchema,
    from: z.coerce.date<Date>().optional(),
    to: z.coerce.date<Date>().optional(),
  }),
};
```

### API Client (`next-frontend/api/{communityFlagApi,communityExportApi}.ts`)

```ts
export const createManualReport = async (communityId: string, params: CommunityFlagRequest["createManualReport"]) => { ... };
export const listFlagQueue = async (communityId: string, status?: string) => { ... };
export const dismissFlag = async (communityId: string, flagId: string) => { ... };
export const actionFlag = async (communityId: string, flagId: string) => { ... };

// Triggers a browser download directly rather than parsing a JSON envelope,
// since the endpoint returns a raw file.
export const downloadExport = async (communityId: string, params: CommunityExportRequest["request"]) => {
  const response = await baseApi.get(`/community/${communityId}/export`, {
    params,
    responseType: "blob",
  });
  return response; // caller triggers the browser save via a temporary object URL
};
```

### React Query Hooks (`next-frontend/components/hooks/{communityFlag,communityExport}/`)

- `useFlagQueue(communityId, status)` — `useQuery`, manager/owner only.
- `useCreateManualReport(communityId)` — `useMutation`, toast "Report submitted for review" — not optimistic (nothing visible changes for the reporter; the queue is manager-facing).
- `useDismissFlag(communityId)` / `useActionFlag(communityId)` — `useMutation` with **optimistic update**: removes the flag from the `pending` queue view immediately (moves to "resolved" locally), rollback on failure — a manager working through a queue expects each decision to feel instant and the row to disappear right away.
- `useDownloadExport(communityId)` — `useMutation` wrapping `downloadExport`, `onSuccess` triggers the browser file-save (`URL.createObjectURL` + a synthetic anchor click), toast "Export downloaded".

`queryKeys.communities` additions:

```ts
flagQueue: (communityId: string, status?: string) => ({
  queryKey: [communityId, "flag-queue", status ?? "pending"],
  queryFn: async () => await CommunityFlagApi.listFlagQueue(communityId, status),
}),
```

(Export is a one-shot download, not cached query state, so it's a mutation
rather than a `queryKeys` entry.)

### UI Components (`next-frontend/components/community/{moderation,export}/`)

- `FlagQueue.tsx` — manager-only, tabbed by status (Pending / Dismissed / Actioned), `FlagQueueRow` per item.
- `FlagQueueRow.tsx` — flagged member, session summary (category, duration, date), flag type badge (icon + text — see Accessibility), reason (for manual reports), Dismiss/Action buttons.
- `FlagTypeBadge.tsx` — distinct icon per type (clock icon for implausible-duration, calendar-stack icon for excessive-daily-total, flag icon for manual-report) plus a text label.
- `ReportSessionDialog.tsx` — opened from a session row in the community's own contribution view ("Report" action), reason textarea, submit.
- `ExportDialog.tsx` — period selector (reusing the same period-selector component the v2 leaderboard/v3 analytics dashboard already use), format toggle (CSV/JSON), **Download** button.

Primary user journey — a manager reviews and actions a flag:

1. Manager opens the community's **Moderation** tab (only visible to
   manager/owner — hidden entirely from the nav for regular members) →
   `FlagQueue` loads the `pending` tab by default (skeleton rows while
   `useFlagQueue` is pending).
2. Manager reviews a `FlagQueueRow` showing a member's 14-hour session
   flagged as `implausible_duration`.
3. Manager clicks **Action** (excludes it from the aggregate) →
   `useActionFlag` optimistically removes the row from the pending list;
   toast confirms "Flag actioned — excluded from community totals."
4. The flagged member's *personal* session is untouched — they see no
   change anywhere in their own dashboard, statistics, or session list;
   only the community's own aggregate/leaderboard/export numbers change.
5. If a manager instead clicks **Dismiss** on a false positive (e.g. a
   legitimately long study session), the row is removed from `pending`
   with no effect on aggregation, toast "Flag dismissed."

## UX & Polish

- **Loading state**: `FlagQueue` renders 4 skeleton rows (avatar + two text lines + two button placeholders); `ExportDialog` shows a spinner on the Download button itself while the request is in flight (this is the one place in v4 a plain spinner is appropriate — it's a single-shot file generation action, not a page-level loading state).
- **Empty state** (no flagged entries): heading "Nothing to review", body "No suspicious time entries right now — the automated checks run hourly." (distinguishes "empty because clean" from "empty because broken," reassuring the manager the feature is active).
- **Error states** (toast copy):
  - Manual report fails: title "Couldn't submit report", description "Something went wrong — try again."
  - Action/dismiss fails (permission race, e.g. role changed mid-session): title "Couldn't update this flag", description "You may no longer have permission to do this — refresh and try again."
  - Export fails (e.g. transient server error generating the file): title "Couldn't generate export", description "Something went wrong creating your export — try again in a moment."
  - Export requested for an empty period (no data in range): not an error — `ExportDialog` still downloads a valid file with a header row and zero data rows, since "no activity this period" is a legitimate, exportable answer, not a failure.
- **Optimistic updates**: dismiss/action on a flag feel instant with rollback, per the "manager working through a queue" rationale above; manual reports and exports are not optimistic (a report has no visible local state to optimistically update, and an export must actually complete before there's anything to hand the browser).
- **Responsive (mobile)**: `FlagQueueRow` collapses from a horizontal row (avatar, session summary, badge, actions all in one line) to a stacked card (avatar+name row, session summary row, badge, then a full-width two-button action row) under `md`; `ExportDialog`'s period selector and format toggle stack vertically instead of side-by-side.
- **Accessibility**: flag type is conveyed with icon + text label in `FlagTypeBadge`, never color/icon alone; Dismiss/Action buttons have `aria-label`s that include the flagged member's name ("Dismiss flag for Jane Doe") since two adjacent rows can otherwise have identical button text; the review queue's status tabs use proper `role="tablist"`/`role="tab"`/`aria-selected`; `ExportDialog`'s Download button shows a text state change ("Generating...") in addition to a spinner, and the button is disabled (not just visually dimmed) while in flight to prevent duplicate downloads from repeated clicks.

## Acceptance Criteria

- [ ] A session longer than 12 hours mapped into a community is auto-flagged as `implausible_duration` by the scan job; one shorter than the community's `max_plausible_session_hours` (if set above 12) is not.
- [ ] A member whose community-mapped sessions sum to more than 16 hours on one calendar day gets exactly one `excessive_daily_total` flag for that day (the longest contributing session), not one per session.
- [ ] Re-running the scan job never creates a duplicate `pending` auto-flag for the same `(community_id, session_id, flag_type)`.
- [ ] Any member can manually report a session they can see within the community; the report requires a non-empty reason.
- [ ] Only manager/owner can view the review queue, dismiss a flag, or action a flag.
- [ ] Actioning a flag excludes that session from the community's aggregate/leaderboard/export from that point on; it never modifies the underlying `session` row.
- [ ] Dismissing a flag has no effect on aggregation.
- [ ] Manual reports notify all managers/owners of the community with `community:flag_raised`.
- [ ] Only manager/owner can request an export; the export contains aggregate per-member/per-category totals only, never raw session-level detail.
- [ ] An export for a period with zero qualifying data still downloads successfully with an empty (but well-formed) body.

## Testing Notes

- Backend (`cargo test`):
  - `community_moderation_service`:
    - `scan_flags_session_over_global_ceiling` — seeds a 13h mapped session, no `max_plausible_session_hours` set, asserts a `pending` `implausible_duration` flag is created.
    - `scan_does_not_flag_session_under_ceiling` — seeds an 11h session, asserts no flag.
    - `scan_respects_looser_community_ceiling` — sets `max_plausible_session_hours = 15`, seeds a 14h session, asserts no flag; seeds a 16h session, asserts a flag.
    - `scan_flags_one_representative_session_per_excessive_day` — seeds three sessions on the same day summing to 18h, asserts exactly one flag exists for that member/day, on the longest of the three sessions.
    - `scan_is_idempotent_no_duplicate_pending_flags` — runs the scan twice against the same data, asserts flag count unchanged after the second run.
    - `dismissed_flag_can_be_reflagged_later` — dismisses a flag, changes community config so the same session now qualifies under a different/same heuristic, re-runs scan, asserts a new `pending` flag exists alongside the `dismissed` one.
    - `member_can_manually_report_visible_session`, `member_cannot_report_session_hidden_by_data_visibility` — asserts `Err` for a `members_only` community where the target session belongs to a member whose data is anonymized to the reporter.
    - `only_manager_or_owner_can_dismiss_or_action_flag` — table-test over roles.
    - `actioning_flag_excludes_session_from_aggregation_query` — actions a flag, re-runs the v1 aggregation query, asserts the session's minutes are absent from the total; asserts the member's own personal `session` row and personal statistics are unchanged.
  - `community_export_service`:
    - `export_csv_contains_expected_columns_and_rows` — asserts header row matches `member_username,total_minutes,category_<name>_minutes,...,rank` and row count matches member count.
    - `export_json_matches_schema` — asserts `CommunityExportDto` round-trips through serde correctly.
    - `export_excludes_actioned_flagged_sessions` — actions a flag, asserts the exported totals reflect the exclusion.
    - `export_for_empty_period_still_succeeds` — asserts a well-formed empty export rather than an error.
    - `only_manager_or_owner_can_request_export` — asserts `Err` for a `member`-role actor.
- Frontend (Storybook stories under `next-frontend/stories/community/{moderation,export}/`):
  - `FlagQueue.stories.tsx` — Default, Empty, Loading, MixedFlagTypes.
  - `FlagQueueRow.stories.tsx` — AutoImplausibleDuration, AutoExcessiveDailyTotal, ManualReport.
  - `ReportSessionDialog.stories.tsx` — Default, ValidationErrorEmptyReason.
  - `ExportDialog.stories.tsx` — Default, Generating, DownloadError.
