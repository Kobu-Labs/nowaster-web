# Step 4: Mentorship Matching

## Overview

Lets experienced members opt in as mentors and new members opt in as
mentees, and lets a manager/owner manually pair them. This is **not** an
automated matcher — v4 picks manual manager-assigned pairing deliberately:
it's simple, auditable, and appropriate for community sizes where a
manager can reasonably look at a short opt-in list (a university
department, a bootcamp cohort), which is the primary use case named in the
planning doc. Depends on `community_member` (v1/v2) for role checks and
`community_member_streak`/aggregate time (v1/v3) to give the manager
context on who's "experienced" when pairing.

## Scope

- In scope:
  - Opt in as a mentor and/or mentee (a member can be both, e.g. a
    mid-level member mentoring a newcomer while being mentored by a
    veteran) with a short free-text note ("what I can help with" /
    "what I'm hoping to learn").
  - Opt out at any time (withdraws from the pool; existing pairings are
    unaffected until explicitly ended).
  - Manager/owner views the opt-in pool (separate mentor and mentee lists)
    and manually creates a pairing between one mentor and one mentee.
  - A mentee can be paired with at most one active mentor at a time; a
    mentor can have multiple concurrent mentees (no cap in v4 — a manager
    exercising judgment is the only guardrail, consistent with "manual,
    not algorithmic").
  - End a pairing — either paired member or manager/owner, with an
    optional reason note.
  - Both members of a pairing see each other's profile-level community
    stats (same fields as the leaderboard, respecting `data_visibility`)
    to ground the mentorship in actual activity.
- Explicitly deferred / out of scope:
  - Automated/algorithmic matching (e.g. by shared tracked category,
    availability, activity pattern) — explicitly deferred; v4 ships manual
    pairing only. An algorithmic matcher is a reasonable v5+ idea once
    there's real usage data on how managers actually pair people.
  - In-app messaging between mentor/mentee (no messaging system exists
    anywhere in the app; pairing surfaces each other's identity so they
    can coordinate via whatever channel they already use — email, the
    existing friend system if they choose to also friend each other, etc).
  - Mentorship goals/milestones tracking beyond the free-text notes (a
    structured goals feature is its own slice, not bundled here).
  - Group mentorship (one mentor : many mentees as separate 1:1 pairings
    is supported; a single shared "group" pairing entity is not).

## Data Model

Migration filename: `backend/migrations/0082_create_community_mentorship_tables.sql`

```sql
CREATE TABLE community_mentorship_interest (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    wants_to_mentor BOOLEAN NOT NULL DEFAULT FALSE,
    wants_a_mentor BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT NULL CHECK (note IS NULL OR char_length(note) <= 500),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_mentorship_interest_member UNIQUE (member_id),
    CONSTRAINT chk_interest_at_least_one CHECK (wants_to_mentor OR wants_a_mentor)
);

CREATE INDEX idx_mentorship_interest_community_mentor
    ON community_mentorship_interest(community_id)
    WHERE wants_to_mentor = TRUE;

CREATE INDEX idx_mentorship_interest_community_mentee
    ON community_mentorship_interest(community_id)
    WHERE wants_a_mentor = TRUE;

CREATE TYPE community_mentorship_pair_status AS ENUM (
    'active',
    'ended'
);

CREATE TABLE community_mentorship_pair (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    mentor_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,
    mentee_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,
    paired_by_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    status community_mentorship_pair_status NOT NULL DEFAULT 'active',
    end_reason TEXT NULL CHECK (end_reason IS NULL OR char_length(end_reason) <= 500),

    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE NULL,

    CONSTRAINT chk_mentor_mentee_distinct CHECK (mentor_member_id <> mentee_member_id)
);

-- A mentee can have at most one *active* pairing at a time.
CREATE UNIQUE INDEX uq_mentorship_pair_active_mentee
    ON community_mentorship_pair(mentee_member_id)
    WHERE status = 'active';

CREATE INDEX idx_mentorship_pair_mentor
    ON community_mentorship_pair(mentor_member_id, status);
```

Migration filename: `backend/migrations/0083_add_mentorship_notification_types.sql`

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:mentorship_paired';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:mentorship_ended';
```

### Rust entities (`backend/src/entity/community_mentorship.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MentorshipInterest {
    pub id: Uuid,
    pub community_id: Uuid,
    pub member_id: Uuid,
    pub wants_to_mentor: bool,
    pub wants_a_mentor: bool,
    pub note: Option<String>,
}

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_mentorship_pair_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum MentorshipPairStatus {
    Active,
    Ended,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MentorshipPair {
    pub id: Uuid,
    pub community_id: Uuid,
    pub mentor_member_id: Uuid,
    pub mentee_member_id: Uuid,
    pub paired_by_member_id: Uuid,
    pub status: MentorshipPairStatus,
    pub started_at: DateTime<Local>,
    pub ended_at: Option<DateTime<Local>>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_mentorship.rs`)

```rust
pub struct CommunityMentorshipRepository { db: Arc<Database> }

impl CommunityMentorshipRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn upsert_interest(&self, community_id: Uuid, member_id: Uuid, dto: UpsertMentorshipInterestDto) -> Result<MentorshipInterest>;
    pub async fn withdraw_interest(&self, member_id: Uuid) -> Result<()>;
    pub async fn list_mentor_pool(&self, community_id: Uuid) -> Result<Vec<MentorshipInterestWithMemberDto>>;
    pub async fn list_mentee_pool(&self, community_id: Uuid) -> Result<Vec<MentorshipInterestWithMemberDto>>;
    pub async fn get_member_active_pairing_as_mentee(&self, member_id: Uuid) -> Result<Option<MentorshipPair>>;

    pub async fn create_pairing(&self, community_id: Uuid, mentor_member_id: Uuid, mentee_member_id: Uuid, paired_by_member_id: Uuid) -> Result<MentorshipPairWithMembersDto>;
    pub async fn end_pairing(&self, pair_id: Uuid, end_reason: Option<String>) -> Result<MentorshipPairWithMembersDto>;
    pub async fn list_pairings_for_member(&self, member_id: Uuid) -> Result<Vec<MentorshipPairWithMembersDto>>;
    pub async fn list_all_pairings(&self, community_id: Uuid, status: Option<MentorshipPairStatus>) -> Result<Vec<MentorshipPairWithMembersDto>>;
}
```

### Service (`backend/src/service/community_mentorship_service.rs`)

- **Opt in**: any member. At least one of `wants_to_mentor`/`wants_a_mentor`
  must be true — validated by the DB `CHECK` and mirrored in the DTO
  validator for a friendlier error ("Choose at least one: mentor, mentee,
  or both.").
- **Withdraw**: a member can withdraw their own interest row any time — a
  manager cannot withdraw on someone else's behalf (opting in/out is a
  personal choice, unlike pairing which is a manager action).
- **Create pairing**: manager/owner only. Validates: both `mentor` and
  `mentee` are members of `community_id`; `mentor_member_id !=
  mentee_member_id`; the prospective mentee has no existing `active`
  pairing (checked via `get_member_active_pairing_as_mentee`, backstopped
  by the partial unique index — the service check exists to return a
  friendly "This member already has an active mentor" instead of a raw DB
  constraint violation). The service does **not** require either party to
  have an `community_mentorship_interest` row expressing interest before
  pairing — a manager may know two people who'd be a good fit even if one
  hasn't formally opted in yet — but the UI strongly steers managers to
  the opt-in pools as the primary pairing surface.
- **End pairing**: either member of the pairing, or manager/owner. Sets
  `status = 'ended'`, `ended_at = now()`, optional `end_reason`.
- On successful pairing: notify both mentor and mentee with
  `community:mentorship_paired` (content includes the other party's
  `ReadUserDto` and community name), insert `community_activity_event`
  with `event_type = 'mentorship_paired'` (member-identifying — this one
  is not anonymized, since both parties already know about it and a
  manager did it deliberately, unlike e.g. progress-comparison data which
  v3 keeps anonymous).
- On end: notify both parties with `community:mentorship_ended`.

### DTOs

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpsertMentorshipInterestDto {
    pub wants_to_mentor: bool,
    pub wants_a_mentor: bool,
    #[validate(length(max = 500))]
    pub note: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreatePairingDto {
    pub mentor_member_id: Uuid,
    pub mentee_member_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct EndPairingDto {
    pub pair_id: Uuid,
    #[validate(length(max = 500))]
    pub end_reason: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MentorshipInterestWithMemberDto {
    pub member: ReadUserDto,
    pub member_id: Uuid,
    pub wants_to_mentor: bool,
    pub wants_a_mentor: bool,
    pub note: Option<String>,
    pub total_tracked_minutes: Option<i64>, // None if data_visibility hides it from the requesting actor
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MentorshipPairWithMembersDto {
    pub id: Uuid,
    pub mentor: ReadUserDto,
    pub mentee: ReadUserDto,
    pub status: MentorshipPairStatus,
    pub started_at: DateTime<Local>,
    pub ended_at: Option<DateTime<Local>>,
}
```

### Router (`backend/src/router/community/mentorship.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| PUT | `/api/community/:id/mentorship/interest` | `upsert_interest_handler` | member | Opt in / update note |
| DELETE | `/api/community/:id/mentorship/interest` | `withdraw_interest_handler` | member | Opt out |
| GET | `/api/community/:id/mentorship/pool` | `list_pool_handler` | manager/owner | Mentor + mentee opt-in lists |
| POST | `/api/community/:id/mentorship/pairs` | `create_pairing_handler` | manager/owner | Manually pair mentor + mentee |
| DELETE | `/api/community/:id/mentorship/pairs/:pair_id` | `end_pairing_handler` | paired member or manager/owner | End a pairing |
| GET | `/api/community/:id/mentorship/pairs/mine` | `list_my_pairings_handler` | member | Actor's own pairings (as mentor and/or mentee) |
| GET | `/api/community/:id/mentorship/pairs` | `list_all_pairings_handler` | manager/owner | All pairings, optional `?status=` |

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, community_id = %community_id))]
async fn create_pairing_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreatePairingDto>,
) -> ApiResponse<MentorshipPairWithMembersDto> {
    let result = state
        .community_mentorship_service
        .create_pairing(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/communityMentorship.ts`)

```ts
export const MentorshipPairStatusSchema = z.enum(["active", "ended"]);

export const MentorshipInterestSchema = z.object({
  member: ReadUserSchema,
  member_id: z.string().uuid(),
  wants_to_mentor: z.boolean(),
  wants_a_mentor: z.boolean(),
  note: z.string().max(500).nullable(),
  total_tracked_minutes: z.number().int().nullable(),
});

export const MentorshipPairSchema = z.object({
  id: z.string().uuid(),
  mentor: ReadUserSchema,
  mentee: ReadUserSchema,
  status: MentorshipPairStatusSchema,
  started_at: z.coerce.date<Date>(),
  ended_at: z.coerce.date<Date>().nullable(),
});
export type MentorshipPair = z.infer<typeof MentorshipPairSchema>;
export type MentorshipInterest = z.infer<typeof MentorshipInterestSchema>;

const upsertInterest = z
  .object({
    wants_to_mentor: z.boolean(),
    wants_a_mentor: z.boolean(),
    note: z.string().trim().max(500).optional(),
  })
  .refine((data) => data.wants_to_mentor || data.wants_a_mentor, {
    message: "Choose at least one: mentor, mentee, or both",
    path: ["wants_to_mentor"],
  });

const createPairing = z.object({
  mentor_member_id: z.string().uuid(),
  mentee_member_id: z.string().uuid(),
});

const endPairing = z.object({ pair_id: z.string().uuid(), end_reason: z.string().trim().max(500).optional() });

export const CommunityMentorshipRequestSchema = { upsertInterest, createPairing, endPairing };
export type CommunityMentorshipRequest = {
  [K in keyof typeof CommunityMentorshipRequestSchema]: z.infer<(typeof CommunityMentorshipRequestSchema)[K]>;
};
```

### API Client (`next-frontend/api/communityMentorshipApi.ts`)

```ts
export const upsertInterest = async (communityId: string, params: CommunityMentorshipRequest["upsertInterest"]) => { ... };
export const withdrawInterest = async (communityId: string) => { ... };
export const listPool = async (communityId: string) => { ... };
export const createPairing = async (communityId: string, params: CommunityMentorshipRequest["createPairing"]) => { ... };
export const endPairing = async (communityId: string, params: CommunityMentorshipRequest["endPairing"]) => { ... };
export const listMyPairings = async (communityId: string) => { ... };
export const listAllPairings = async (communityId: string, status?: "active" | "ended") => { ... };
```

### React Query Hooks (`next-frontend/components/hooks/communityMentorship/`)

- `useMentorshipPool(communityId)` — `useQuery`, manager/owner only, `queryKeys.communities.mentorshipPool(communityId)`.
- `useMyMentorshipPairings(communityId)` — `useQuery`, `queryKeys.communities.myMentorshipPairings(communityId)`.
- `useAllMentorshipPairings(communityId, status)` — `useQuery`, manager/owner view.
- `useUpsertMentorshipInterest(communityId)` — `useMutation`, invalidates `mentorshipPool(communityId)`, toast "You're on the mentorship list".
- `useWithdrawMentorshipInterest(communityId)` — `useMutation`, invalidates on success, toast "Removed from the mentorship list".
- `useCreateMentorshipPairing(communityId)` — `useMutation`, invalidates `mentorshipPool` and `allMentorshipPairings`, toast "Paired {mentee} with {mentor}".
- `useEndMentorshipPairing(communityId)` — `useMutation` with optimistic removal from the "active pairings" list, rollback on failure.

`queryKeys.communities` additions:

```ts
mentorshipPool: (communityId: string) => ({
  queryKey: [communityId, "mentorship-pool"],
  queryFn: async () => await CommunityMentorshipApi.listPool(communityId),
}),
myMentorshipPairings: (communityId: string) => ({
  queryKey: [communityId, "mentorship-pairings", "mine"],
  queryFn: async () => await CommunityMentorshipApi.listMyPairings(communityId),
}),
allMentorshipPairings: (communityId: string, status?: string) => ({
  queryKey: [communityId, "mentorship-pairings", "all", status ?? "any"],
  queryFn: async () => await CommunityMentorshipApi.listAllPairings(communityId, status as "active" | "ended" | undefined),
}),
```

### UI Components (`next-frontend/components/community/mentorship/`)

- `MentorshipOptInCard.tsx` — checkboxes for "I can mentor" / "I'm looking for a mentor", note textarea, member-facing.
- `MentorshipPoolTable.tsx` — manager-only, two columns/tabs (mentors, mentees), each row shows member, note, tracked-time context, and a "Pair with..." action.
- `PairMentorshipDialog.tsx` — manager picks a mentor from one dropdown and a mentee from another (pre-filtered to the pool, mentee dropdown excludes anyone already actively paired), confirms.
- `MyMentorshipPairings.tsx` — member-facing card list of their own active/past pairings, shows the other party, "End pairing" action.
- `MentorshipPairCard.tsx` — shared card used in both the manager's all-pairings view and the member's own-pairings view, mentor/mentee labeled roles, status badge.

Primary user journey — manager pairs a mentor and mentee:

1. Manager opens **Mentorship** tab → sees `MentorshipPoolTable` with two lists (mentors, mentees) loaded via `useMentorshipPool`.
2. Manager clicks **Pair with...** next to a mentee row → `PairMentorshipDialog` opens, mentee pre-selected, mentor dropdown lists the mentor pool.
3. Manager selects a mentor, confirms → `useCreateMentorshipPairing` fires; on success, toast confirms, both pool lists refetch (the paired mentee typically disappears from "needs a mentor" framing, though technically they can still appear in the pool list with a "currently paired" indicator rather than being hidden, so the manager retains visibility).
4. Both the mentor and mentee receive a `community:mentorship_paired` notification identifying the other party.
5. Either party can later open **My Mentorships** → `MyMentorshipPairings` → **End pairing**, optionally leaving a short reason.

## UX & Polish

- **Loading state**: `MentorshipPoolTable` renders 3 skeleton rows per column; `MyMentorshipPairings` renders 2 skeleton cards.
- **Empty state** (no one in the pool yet): heading "No mentors available yet", body "Once members opt in as mentors or mentees, they'll show up here for pairing." — shown per-column (mentors/mentees) independently since one list can be empty while the other isn't. Member-facing opt-out state (member hasn't opted in): the `MentorshipOptInCard` itself doubles as the empty state — no separate copy needed, the card is always visible with an "Interested in mentoring or being mentored?" heading.
- **Error states** (toast copy):
  - Pairing fails because mentee already has an active mentor (race — two managers pairing simultaneously): title "Couldn't create pairing", description "This member already has an active mentor."
  - Opting in fails validation: title "Couldn't update your mentorship status", description "Choose at least one: mentor, mentee, or both."
  - Ending a pairing fails (permission race): title "Couldn't end pairing", description "You may no longer have permission to do this."
- **Optimistic updates**: ending a pairing removes it from the active list instantly with rollback; opting in/out updates `MentorshipOptInCard`'s own checkboxes instantly (it's editing the actor's own state, low risk, matches the "feels instant" bar); pairing creation is not optimistic (a manager needs confirmation the pairing actually landed before treating it as done).
- **Responsive (mobile)**: `MentorshipPoolTable` collapses from a two-column side-by-side layout to two stacked full-width sections with a tab switcher (Mentors / Mentees) under `md`; `PairMentorshipDialog`'s two dropdowns stack vertically; `MentorshipPairCard` truncates notes to one line with a tap-to-expand on mobile.
- **Accessibility**: opt-in checkboxes are real `<input type="checkbox">` elements with associated `<label>`s, not custom divs; `PairMentorshipDialog` traps focus, first field (mentee, if not pre-selected) receives initial focus; the mentor/mentee role distinction in `MentorshipPairCard` is conveyed with a text label ("Mentor" / "Mentee") next to each name, not just position or color; the pool table uses proper `<table>` semantics with `<th scope="col">` headers so screen readers announce column context per cell.

## Acceptance Criteria

- [ ] A member can opt in as mentor, mentee, or both, with a note; opting in with neither checked is rejected client- and server-side.
- [ ] A member can withdraw their own interest; a manager cannot withdraw another member's interest on their behalf.
- [ ] Only manager/owner can view the opt-in pool or create a pairing.
- [ ] A mentee cannot be actively paired with more than one mentor at a time; attempting a second pairing while one is active is rejected with a clear message.
- [ ] A mentor can have multiple concurrent active mentees.
- [ ] Either party of a pairing, or manager/owner, can end it; other members cannot.
- [ ] Both parties receive a `community:mentorship_paired` notification on pairing and `community:mentorship_ended` on ending.
- [ ] A pairing between a member and themselves is rejected (`mentor_member_id != mentee_member_id`).

## Testing Notes

- Backend (`cargo test`, `community_mentorship_service` tests):
  - `interest_requires_at_least_one_role` — both flags false, asserts `Err`.
  - `member_can_opt_in_as_both_mentor_and_mentee`.
  - `member_can_withdraw_own_interest`, `manager_cannot_withdraw_other_members_interest` — asserts the endpoint/service only accepts the caller's own member id, verified via the `Actor` used, not a passed-in id.
  - `only_manager_or_owner_can_create_pairing` — table-test over roles.
  - `cannot_pair_mentee_with_second_active_mentor` — seeds an active pairing, attempts a second, asserts `Err` with "already has an active mentor".
  - `cannot_pair_member_with_self` — asserts `Err`.
  - `ending_pairing_notifies_both_parties` — spy/mock assertion on notification calls.
  - `mentee_can_end_own_pairing`, `mentor_can_end_own_pairing`, `unrelated_member_cannot_end_pairing`.
- Frontend (Storybook stories under `next-frontend/stories/community/mentorship/`):
  - `MentorshipOptInCard.stories.tsx` — NotOptedIn, MentorOnly, MenteeOnly, Both, ValidationError.
  - `MentorshipPoolTable.stories.tsx` — Default, EmptyMentors, EmptyMentees, BothEmpty.
  - `PairMentorshipDialog.stories.tsx` — Default, MenteePreselected, ServerErrorAlreadyPaired.
  - `MyMentorshipPairings.stories.tsx` — NoPairings, AsMentor, AsMentee, Mixed.
