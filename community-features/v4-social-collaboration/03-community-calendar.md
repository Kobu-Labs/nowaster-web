# Step 3: Community Calendar

## Overview

A shared calendar for events and deadlines relevant to the community —
study sessions, competition deadlines, meetups. Any member can propose an
event; managers/owners can mark one "official" (visually distinguished,
e.g. a hard deadline vs. an ad-hoc study meetup). Members RSVP, and RSVP'd
members get a reminder notification before the event starts. Depends on
`community_member` (v1/v2) and optionally `community_tracked_category`
(v1) for category-scoped events (e.g. "Algorithms exam").

## Scope

- In scope:
  - Create an event: title, description, optional location (free text —
    could be a room name or a video-call URL, not validated as either),
    start/end time, all-day flag, optional tracked-category scope.
  - Mark an event "official" — manager/owner only; regular member-created
    events are unofficial by default and visually lighter-weight.
  - Edit/cancel an event — creator or manager/owner.
  - RSVP to an event: `going` / `maybe` / `not_going`, changeable any time
    before the event starts.
  - List/RSVP counts per event (going/maybe/not_going counts; who exactly
    RSVP'd is visible to members per `data_visibility`, same convention as
    the dashboard's member-level data).
  - Month-grid and upcoming-list calendar views.
  - Reminder notification: a background job checks for events starting
    within the next hour and sends a `community:calendar_event_reminder`
    notification to every member whose RSVP is `going`.
- Explicitly deferred / out of scope:
  - Recurring calendar events (the existing `session_template` /
    `RecurringSessionInterval` concept is for a single user's own recurring
    *sessions*, not shared community events — a genuinely different domain,
    reusing it would conflate personal scheduling with community
    coordination; a v4 community event is a one-off row. Recurrence for
    community events is a plausible post-v4 feature, not built here).
  - Calendar sync (iCal export/Google Calendar sync) — no existing calendar
    integration in the codebase to extend.
  - Timezone-aware per-member display beyond what the app already does for
    sessions (events store `TIMESTAMP WITH TIME ZONE` and render in the
    viewer's local time exactly like sessions already do — no new timezone
    handling needed).
  - Video-call integration (location is a plain text/URL field only).

## Data Model

Migration filename: `backend/migrations/0080_create_community_calendar_tables.sql`

```sql
CREATE TYPE community_calendar_rsvp_status AS ENUM (
    'going',
    'maybe',
    'not_going'
);

CREATE TABLE community_calendar_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    tracked_category_id UUID NULL REFERENCES community_tracked_category(id) ON DELETE SET NULL,
    created_by_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
    description TEXT NULL CHECK (description IS NULL OR char_length(description) <= 2000),
    location TEXT NULL CHECK (location IS NULL OR char_length(location) <= 300),

    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    all_day BOOLEAN NOT NULL DEFAULT FALSE,

    is_official BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,

    CONSTRAINT chk_event_end_after_start CHECK (end_at >= start_at)
);

CREATE INDEX idx_calendar_event_community_start
    ON community_calendar_event(community_id, start_at)
    WHERE cancelled_at IS NULL;

-- Supports the reminder job's scan: events starting soon that haven't been reminded yet.
CREATE INDEX idx_calendar_event_reminder_scan
    ON community_calendar_event(start_at)
    WHERE cancelled_at IS NULL AND reminder_sent_at IS NULL;

-- Sub-table for RSVPs, following the same "sub-resource gets its own table"
-- pattern v2 used for community_invite off of community.
CREATE TABLE community_calendar_rsvp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES community_calendar_event(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,
    status community_calendar_rsvp_status NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_calendar_rsvp_event_member UNIQUE (event_id, member_id)
);

CREATE INDEX idx_calendar_rsvp_event_status
    ON community_calendar_rsvp(event_id, status);
```

Migration filename: `backend/migrations/0081_add_calendar_notification_types.sql`

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:calendar_event_reminder';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:calendar_event_cancelled';
```

### Rust entities (`backend/src/entity/community_calendar.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_calendar_rsvp_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum RsvpStatus {
    Going,
    Maybe,
    NotGoing,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityCalendarEvent {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Option<Uuid>,
    pub created_by_member_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start_at: DateTime<Local>,
    pub end_at: DateTime<Local>,
    pub all_day: bool,
    pub is_official: bool,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityCalendarRsvp {
    pub id: Uuid,
    pub event_id: Uuid,
    pub member_id: Uuid,
    pub status: RsvpStatus,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_calendar.rs`)

```rust
pub struct CommunityCalendarRepository { db: Arc<Database> }

impl CommunityCalendarRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn create_event(&self, community_id: Uuid, created_by_member_id: Uuid, dto: CreateCalendarEventDto) -> Result<CalendarEventWithRsvpCountsDto>;
    pub async fn get_event(&self, event_id: Uuid) -> Result<Option<CalendarEventWithRsvpCountsDto>>;
    pub async fn list_events(&self, community_id: Uuid, from: DateTime<Local>, to: DateTime<Local>) -> Result<Vec<CalendarEventWithRsvpCountsDto>>;
    pub async fn update_event(&self, event_id: Uuid, dto: UpdateCalendarEventDto) -> Result<CalendarEventWithRsvpCountsDto>;
    pub async fn set_official(&self, event_id: Uuid, is_official: bool) -> Result<CalendarEventWithRsvpCountsDto>;
    pub async fn cancel_event(&self, event_id: Uuid) -> Result<CalendarEventWithRsvpCountsDto>;

    pub async fn upsert_rsvp(&self, event_id: Uuid, member_id: Uuid, status: RsvpStatus) -> Result<CommunityCalendarRsvp>;
    pub async fn list_rsvps(&self, event_id: Uuid) -> Result<Vec<RsvpWithMemberDto>>;

    // Used by the reminder job.
    pub async fn find_events_needing_reminder(&self, within: chrono::Duration) -> Result<Vec<CommunityCalendarEvent>>;
    pub async fn mark_reminder_sent(&self, event_id: Uuid) -> Result<()>;
    pub async fn list_going_member_user_ids(&self, event_id: Uuid) -> Result<Vec<String>>;
}
```

### Service (`backend/src/service/community_calendar_service.rs`)

- **Create event**: actor must be a member. `end_at >= start_at` validated
  at the service layer with a friendly message ("End time must be after
  start time") in addition to the DB `CHECK`. `is_official` cannot be set
  `true` on create by a plain `member` — silently forced to `false`
  regardless of what the client sends unless actor is manager/owner (fail
  closed, don't error, since a member might reasonably not know the rule —
  matches how invite-code creation degrades gracefully elsewhere in this
  codebase's philosophy of clear but non-punitive UX).
- **Edit/cancel**: creator or manager/owner. Editing `start_at`/`end_at`
  after RSVPs exist is allowed (no lock) but the service inserts a
  `community_activity_event` (`event_type = 'calendar_event_updated'`) so
  it's visible in the feed; cancelling notifies every RSVP'd member with
  `community:calendar_event_cancelled` regardless of RSVP status (`going`,
  `maybe`, and even `not_going` — they expressed interest once).
- **Set official**: manager/owner only.
- **RSVP**: any member, any time up to `start_at`; after `start_at` the
  service rejects new/changed RSVPs with "This event has already started."
  `upsert_rsvp` is a single unique-constrained upsert
  (`ON CONFLICT (event_id, member_id) DO UPDATE`), not delete+insert, so it
  stays a single round trip and preserves `created_at` for "when did they
  first respond" auditing.
- **Reminder job** (`community_calendar_reminder_job`, invoked by a
  scheduled task the same way `db_backup` presumably runs on a schedule —
  see `backend/src/repository/db_backup.rs` for the existing scheduled-job
  shape to mirror): every 15 minutes, calls
  `find_events_needing_reminder(Duration::hours(1))` (events with
  `start_at` between now and now+1h, `reminder_sent_at IS NULL`,
  `cancelled_at IS NULL`), for each: fetches `going` member user ids, emits
  `community:calendar_event_reminder` to each, then calls
  `mark_reminder_sent`. Idempotent via `reminder_sent_at` so a retried run
  never double-sends.

### DTOs

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateCalendarEventDto {
    #[validate(length(min = 1, max = 150))]
    pub title: String,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    #[validate(length(max = 300))]
    pub location: Option<String>,
    pub start_at: DateTime<Local>,
    pub end_at: DateTime<Local>,
    pub all_day: bool,
    pub tracked_category_id: Option<Uuid>,
    pub is_official: bool, // ignored/forced false server-side unless actor is manager/owner
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateCalendarEventDto {
    pub event_id: Uuid,
    pub title: Option<String>,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start_at: Option<DateTime<Local>>,
    pub end_at: Option<DateTime<Local>>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpsertRsvpDto {
    pub event_id: Uuid,
    pub status: RsvpStatus,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CalendarEventWithRsvpCountsDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Option<Uuid>,
    pub created_by: ReadUserDto,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub start_at: DateTime<Local>,
    pub end_at: DateTime<Local>,
    pub all_day: bool,
    pub is_official: bool,
    pub going_count: i64,
    pub maybe_count: i64,
    pub not_going_count: i64,
    pub my_rsvp: Option<RsvpStatus>,
}
```

### Router (`backend/src/router/community/calendar.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:id/calendar/events?from=&to=` | `list_events_handler` | member | Events in a date range |
| POST | `/api/community/:id/calendar/events` | `create_event_handler` | member | Create event |
| GET | `/api/community/:id/calendar/events/:event_id` | `get_event_handler` | member | Single event + RSVP counts |
| PATCH | `/api/community/:id/calendar/events/:event_id` | `update_event_handler` | creator or manager/owner | Edit event |
| PATCH | `/api/community/:id/calendar/events/:event_id/official` | `set_official_handler` | manager/owner | Mark official/unofficial |
| DELETE | `/api/community/:id/calendar/events/:event_id` | `cancel_event_handler` | creator or manager/owner | Cancel event |
| GET | `/api/community/:id/calendar/events/:event_id/rsvps` | `list_rsvps_handler` | member | Who RSVP'd, per `data_visibility` |
| PUT | `/api/community/:id/calendar/events/:event_id/rsvp` | `upsert_rsvp_handler` | member | Set own RSVP |

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, event_id = %event_id))]
async fn upsert_rsvp_handler(
    State(state): State<AppState>,
    Path((community_id, event_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<UpsertRsvpDto>,
) -> ApiResponse<CalendarEventWithRsvpCountsDto> {
    let result = state
        .community_calendar_service
        .upsert_rsvp(community_id, event_id, payload.status, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/communityCalendar.ts`)

```ts
export const RsvpStatusSchema = z.enum(["going", "maybe", "not_going"]);

export const CommunityCalendarEventSchema = z.object({
  id: z.string().uuid(),
  community_id: z.string().uuid(),
  tracked_category_id: z.string().uuid().nullable(),
  created_by: ReadUserSchema,
  title: z.string().trim().min(1).max(150),
  description: z.string().max(2000).nullable(),
  location: z.string().max(300).nullable(),
  start_at: z.coerce.date<Date>(),
  end_at: z.coerce.date<Date>(),
  all_day: z.boolean(),
  is_official: z.boolean(),
  going_count: z.number().int(),
  maybe_count: z.number().int(),
  not_going_count: z.number().int(),
  my_rsvp: RsvpStatusSchema.nullable(),
});
export type CommunityCalendarEvent = z.infer<typeof CommunityCalendarEventSchema>;

const create = z
  .object({
    title: z.string().trim().min(1, "Give it a title").max(150),
    description: z.string().trim().max(2000).optional(),
    location: z.string().trim().max(300).optional(),
    start_at: z.coerce.date<Date>(),
    end_at: z.coerce.date<Date>(),
    all_day: z.boolean().default(false),
    tracked_category_id: z.string().uuid().optional(),
  })
  .refine((data) => data.end_at >= data.start_at, {
    message: "End time must be after start time",
    path: ["end_at"],
  });

const upsertRsvp = z.object({ event_id: z.string().uuid(), status: RsvpStatusSchema });

export const CommunityCalendarRequestSchema = { create, upsertRsvp };
export type CommunityCalendarRequest = {
  [K in keyof typeof CommunityCalendarRequestSchema]: z.infer<(typeof CommunityCalendarRequestSchema)[K]>;
};
```

### API Client (`next-frontend/api/communityCalendarApi.ts`)

```ts
export const listEvents = async (communityId: string, params: { from: string; to: string }) => { ... };
export const createEvent = async (communityId: string, params: CommunityCalendarRequest["create"]) => { ... };
export const getEvent = async (communityId: string, eventId: string) => { ... };
export const updateEvent = async (communityId: string, eventId: string, params: Partial<CommunityCalendarRequest["create"]>) => { ... };
export const setEventOfficial = async (communityId: string, eventId: string, isOfficial: boolean) => { ... };
export const cancelEvent = async (communityId: string, eventId: string) => { ... };
export const listRsvps = async (communityId: string, eventId: string) => { ... };
export const upsertRsvp = async (communityId: string, params: CommunityCalendarRequest["upsertRsvp"]) => { ... };
```

### React Query Hooks (`next-frontend/components/hooks/communityCalendar/`)

- `useCommunityCalendarEvents(communityId, range)` — `useQuery`, `queryKeys.communities.calendarEvents(communityId, range)`, `staleTime` short (5 min) since RSVP counts change.
- `useCommunityCalendarEvent(communityId, eventId)` — `useQuery`.
- `useCreateCalendarEvent(communityId)` — `useMutation`, invalidates `calendarEvents(communityId)`, toast "Event added to the calendar".
- `useUpsertRsvp(communityId, eventId)` — `useMutation` with **optimistic update**: immediately updates `my_rsvp` and the going/maybe/not_going counts in the cached event (increment new bucket, decrement old bucket), rollback on error — this is the RSVP-should-feel-instant case called out for this step.
- `useSetEventOfficial(communityId)` — `useMutation`, optimistic toggle, manager/owner only UI-gated.
- `useCancelCalendarEvent(communityId)` — `useMutation`, invalidates on success, toast "Event cancelled".

`queryKeys.communities` additions:

```ts
calendarEvents: (communityId: string, range: { from: string; to: string }) => ({
  queryKey: [communityId, "calendar-events", range],
  queryFn: async () => await CommunityCalendarApi.listEvents(communityId, range),
}),
calendarEvent: (eventId: string) => ({
  queryKey: [eventId, "calendar-event"],
  queryFn: async () => await CommunityCalendarApi.getEvent(eventId),
}),
```

### UI Components (`next-frontend/components/community/calendar/`)

- `CommunityCalendarMonthView.tsx` — month grid, days with events show up to 3 event chips + "N more".
- `CommunityCalendarUpcomingList.tsx` — flat chronological list, the default mobile view.
- `CalendarEventChip.tsx` — small pill in the month grid, official events get a filled style + a small badge icon (not color-only — see Accessibility).
- `CalendarEventDetailSheet.tsx` — slide-over/dialog with full details, RSVP buttons, RSVP counts, edit/cancel controls for creator/manager.
- `NewCalendarEventDialog.tsx` — form: title, description, location, start/end date-time pickers, all-day toggle, tracked-category select, "mark official" checkbox (only rendered for manager/owner).
- `RsvpButtonGroup.tsx` — three-way toggle (Going / Maybe / Can't go), instant visual feedback on click.
- `CalendarViewToggle.tsx` — Month / Upcoming list switch.

Primary user journey — RSVPing to an event:

1. Member opens **Calendar** tab → `CommunityCalendarMonthView` loads (skeleton grid while `useCommunityCalendarEvents` is pending), defaulting to the current month.
2. Member clicks a day's event chip → `CalendarEventDetailSheet` opens with event details and current RSVP counts.
3. Member clicks **Going** in `RsvpButtonGroup` → `useUpsertRsvp` optimistically flips the button state and updates the counts instantly; the request fires in the background.
4. On success, nothing visibly changes (already correct). On failure, the button reverts, counts roll back, and a toast explains the failure.
5. One hour before the event, everyone who RSVP'd `going` gets a `community:calendar_event_reminder` notification.

## UX & Polish

- **Loading state**: `CommunityCalendarMonthView` renders a skeleton 7×5 grid with shimmer day cells; `CommunityCalendarUpcomingList` renders 4 skeleton rows (date badge + title line).
- **Empty state**: heading "No events on the calendar yet", body "Deadlines, study sessions, and meetups the community plans will show up here." primary button **Add an event**. Shown in the upcoming-list view when there are zero future events; the month grid itself still renders (an empty grid is still useful for orientation), with the empty-state message as a banner above it.
- **Error states** (toast copy):
  - RSVP fails: title "Couldn't update your RSVP", description "Something went wrong — try again in a moment."
  - Create event fails validation (end before start slips past client somehow): title "Couldn't create event", description "End time must be after start time."
  - Cancel fails (permission race): title "Couldn't cancel event", description "You may no longer have permission to cancel this event."
- **Optimistic updates**: RSVP changes (see above) and the official-toggle both feel instant with rollback; event creation/edit/cancel are not optimistic (they change what other members see and warrant waiting for server confirmation before closing the dialog).
- **Responsive (mobile)**: `CommunityCalendarMonthView` is hidden below `md` breakpoint in favor of `CommunityCalendarUpcomingList` by default (`CalendarViewToggle` still lets a mobile user opt into a simplified single-week horizontal-scroll grid if they want it, but upcoming-list is the default); `CalendarEventDetailSheet` becomes a full-height bottom sheet on mobile rather than a centered dialog; `RsvpButtonGroup` stacks to a 3-row vertical stack under 375px width.
- **Accessibility**: month grid is keyboard-navigable — arrow keys move focus between day cells, `Enter`/`Space` opens the day's event list, `Home`/`End` jump to the first/last day of the week, `PageUp`/`PageDown` move between months; each day cell has an `aria-label` with the full date and event count ("July 23, 2026, 2 events"); official events are marked with both a filled background *and* a small badge icon + "Official" text in the detail sheet, never color alone; `RsvpButtonGroup` uses `role="group"` with `aria-label="RSVP"` and each button uses `aria-pressed`; `CalendarEventDetailSheet` traps focus and restores it to the triggering chip on close.

## Acceptance Criteria

- [ ] A member can create an event; `is_official` is forced `false` server-side unless the actor is manager/owner regardless of what the client sends.
- [ ] `end_at < start_at` is rejected both client-side and server-side with a clear message.
- [ ] Manager/owner can mark any event official/unofficial.
- [ ] Creator or manager/owner can edit or cancel an event; other members cannot.
- [ ] A member can RSVP `going`/`maybe`/`not_going`; changing RSVP updates counts correctly (old bucket -1, new bucket +1) both optimistically and after server confirmation.
- [ ] RSVP is rejected once `start_at` has passed, with a clear message.
- [ ] Members with `going` RSVP receive a `community:calendar_event_reminder` notification within the hour before `start_at`, exactly once (idempotent via `reminder_sent_at`).
- [ ] Cancelling an event notifies every member who RSVP'd (any status) with `community:calendar_event_cancelled`.
- [ ] A non-member cannot view, create, or RSVP to a community's calendar events.

## Testing Notes

- Backend (`cargo test`, `community_calendar_service` tests):
  - `member_created_event_is_never_official` — creates with `is_official: true` as a `member`-role actor, asserts stored `is_official == false`.
  - `manager_can_create_official_event`.
  - `create_event_rejects_end_before_start`.
  - `only_creator_or_manager_can_edit_event` — table-test.
  - `rsvp_upsert_is_idempotent_and_updates_counts` — RSVPs `going` then `maybe` for the same member, asserts `going_count` decreases and `maybe_count` increases, and only one `community_calendar_rsvp` row exists for that `(event_id, member_id)`.
  - `rsvp_rejected_after_event_start` — mocks `start_at` in the past, asserts `Err`.
  - `reminder_job_sends_once_and_marks_reminder_sent` — seeds an event starting in 30 minutes with two `going` RSVPs, runs the job, asserts two notifications sent and `reminder_sent_at` set; runs the job again, asserts no additional notifications (idempotency).
  - `cancel_event_notifies_all_rsvp_statuses` — seeds `going`, `maybe`, and `not_going` RSVPs, cancels, asserts all three receive `community:calendar_event_cancelled`.
- Frontend (Storybook stories under `next-frontend/stories/community/calendar/`):
  - `CommunityCalendarMonthView.stories.tsx` — Default, Empty, Loading, DayWithManyEvents (overflow "+N more").
  - `CalendarEventDetailSheet.stories.tsx` — UnofficialEvent, OfficialEvent, CreatorView, ManagerView, PastEventRsvpDisabled.
  - `RsvpButtonGroup.stories.tsx` — NoResponse, GoingSelected, MaybeSelected, MobileStacked.
  - `NewCalendarEventDialog.stories.tsx` — Default, ValidationErrorEndBeforeStart, OfficialCheckboxManagerOnly.
