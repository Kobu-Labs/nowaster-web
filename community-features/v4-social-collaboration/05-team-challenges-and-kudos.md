# Step 5: Team Challenges and Kudos

## Overview

Two lightweight social/competitive mechanics: **challenges** (time-based
competitions with a defined window and a concrete winner condition) and
**kudos** (freeform peer recognition, distinct from v3's system-awarded
badges — a badge is earned automatically by hitting a threshold, a kudos is
given by another human because they noticed something). Both plug into
`community_activity_event` (v3) and the notification system. Depends on
`community_tracked_category` (v1, challenges can scope to one) and the
aggregation query pattern from v1 step 4 (challenge progress is computed
the same way — join `session` → `community_category_mapping` — not a new
aggregation mechanism).

## Scope

- In scope:
  - Create a challenge: name, description, optional tracked-category
    scope, `start_at`/`end_at` window, one of two concrete challenge
    types:
    - **`leaderboard`**: whoever has the most tracked minutes within the
      window when it ends wins (ties allowed — multiple winners).
    - **`target`**: first (or all, community's choice via
      `target_mode`) participant(s) to reach `target_minutes` within the
      window "complete" the challenge; if nobody reaches it, the challenge
      ends with no winner.
  - Join a challenge as a participant, optionally with a `team_name` (a
    free-text label, e.g. "Team Backend" — sub-group support without a
    formal team entity, matching v4's "team challenges" language without
    inventing a whole teams system).
  - Live progress view: current standings/progress for a leaderboard
    challenge, current progress-toward-target for a target challenge —
    computed at query time (v1's "correctness over scale" philosophy),
    not continuously denormalized.
  - Finalize a challenge: a scheduled job runs at `end_at` (or a
    manager/owner can manually trigger early finalization, e.g. to end a
    challenge early for a valid real-world reason) and freezes the winner
    set.
  - Give kudos: any member to any other member, with a short message,
    rate-limited to 5 given per member per rolling 24 hours to keep it
    meaningful rather than spammy.
  - Kudos received count/list on a member's community profile.
- Explicitly deferred / out of scope:
  - Automated team formation/balancing (teams are just a free-text label a
    participant chooses when joining — no matchmaking).
  - Challenge entry fees/stakes, prizes beyond in-app recognition (out of
    scope — Nowaster has no payments/rewards infra).
  - Kudos categories/types (e.g. "helpful", "consistent") — v4 ships a
    single flat kudos type with a free-text message; categorized kudos is
    a plausible enhancement once there's usage data on what people write.
  - Removing/retracting a given kudos (kudos are permanent once given,
    like the badge system's awards — this keeps the mechanic simple and
    avoids a "kudos wars" edit/retract dynamic).

## Data Model

Migration filename: `backend/migrations/0084_create_community_challenge_tables.sql`

```sql
CREATE TYPE community_challenge_type AS ENUM (
    'leaderboard',
    'target'
);

CREATE TYPE community_challenge_target_mode AS ENUM (
    'first_to_reach',
    'all_who_reach'
);

CREATE TYPE community_challenge_status AS ENUM (
    'upcoming',
    'active',
    'completed',
    'cancelled'
);

CREATE TABLE community_challenge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    tracked_category_id UUID NULL REFERENCES community_tracked_category(id) ON DELETE SET NULL,
    created_by_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
    description TEXT NULL CHECK (description IS NULL OR char_length(description) <= 2000),

    challenge_type community_challenge_type NOT NULL,
    target_mode community_challenge_target_mode NULL, -- required if challenge_type = 'target'
    target_minutes INT NULL CHECK (target_minutes IS NULL OR target_minutes > 0),

    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status community_challenge_status NOT NULL DEFAULT 'upcoming',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    finalized_at TIMESTAMP WITH TIME ZONE NULL,

    CONSTRAINT chk_challenge_end_after_start CHECK (end_at > start_at),
    CONSTRAINT chk_target_fields_consistent CHECK (
        (challenge_type = 'target' AND target_mode IS NOT NULL AND target_minutes IS NOT NULL)
        OR
        (challenge_type = 'leaderboard' AND target_mode IS NULL AND target_minutes IS NULL)
    )
);

CREATE INDEX idx_challenge_community_status
    ON community_challenge(community_id, status, start_at DESC);

CREATE TABLE community_challenge_participant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES community_challenge(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    team_name TEXT NULL CHECK (team_name IS NULL OR char_length(team_name) <= 80),

    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL, -- target challenges: when they hit target_minutes
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,   -- set at finalization

    CONSTRAINT uq_challenge_participant UNIQUE (challenge_id, member_id)
);

CREATE INDEX idx_challenge_participant_challenge
    ON community_challenge_participant(challenge_id);
```

Migration filename: `backend/migrations/0085_create_community_kudos_table.sql`

```sql
CREATE TABLE community_kudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    from_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,
    to_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    message TEXT NULL CHECK (message IS NULL OR char_length(message) <= 200),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_kudos_not_self CHECK (from_member_id <> to_member_id)
);

CREATE INDEX idx_kudos_to_member ON community_kudos(to_member_id, created_at DESC);
-- Backs the rate-limit check: count of kudos given by a member in the last 24h.
CREATE INDEX idx_kudos_from_member_created_at ON community_kudos(from_member_id, created_at DESC);
```

Migration filename: `backend/migrations/0086_add_challenge_kudos_notification_types.sql`

```sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:challenge_started';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:challenge_completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:kudos_received';
```

### Rust entities (`backend/src/entity/community_challenge.rs`, `backend/src/entity/community_kudos.rs`)

```rust
#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_challenge_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ChallengeType { Leaderboard, Target }

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_challenge_target_mode", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ChallengeTargetMode { FirstToReach, AllWhoReach }

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_challenge_status", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ChallengeStatus { Upcoming, Active, Completed, Cancelled }

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityChallenge {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Option<Uuid>,
    pub created_by_member_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub challenge_type: ChallengeType,
    pub target_mode: Option<ChallengeTargetMode>,
    pub target_minutes: Option<i32>,
    pub start_at: DateTime<Local>,
    pub end_at: DateTime<Local>,
    pub status: ChallengeStatus,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityKudos {
    pub id: Uuid,
    pub community_id: Uuid,
    pub from_member_id: Uuid,
    pub to_member_id: Uuid,
    pub message: Option<String>,
    pub created_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_challenge.rs`, `backend/src/repository/community_kudos.rs`)

```rust
pub struct CommunityChallengeRepository { db: Arc<Database> }

impl CommunityChallengeRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn create(&self, community_id: Uuid, created_by_member_id: Uuid, dto: CreateChallengeDto) -> Result<CommunityChallenge>;
    pub async fn get(&self, challenge_id: Uuid) -> Result<Option<CommunityChallenge>>;
    pub async fn list(&self, community_id: Uuid, status: Option<ChallengeStatus>) -> Result<Vec<CommunityChallenge>>;
    pub async fn cancel(&self, challenge_id: Uuid) -> Result<CommunityChallenge>;
    pub async fn set_status(&self, challenge_id: Uuid, status: ChallengeStatus) -> Result<CommunityChallenge>;

    pub async fn join(&self, challenge_id: Uuid, member_id: Uuid, team_name: Option<String>) -> Result<ChallengeParticipantDto>;
    pub async fn leave(&self, challenge_id: Uuid, member_id: Uuid) -> Result<()>;
    pub async fn list_participants(&self, challenge_id: Uuid) -> Result<Vec<ChallengeParticipantDto>>;

    // Computed at query time, joining session -> community_category_mapping,
    // scoped to the challenge window and tracked_category_id if set. Mirrors
    // the v1 aggregation query shape, just windowed.
    pub async fn compute_progress(&self, challenge_id: Uuid) -> Result<Vec<ChallengeProgressDto>>;

    pub async fn mark_participant_completed(&self, participant_id: Uuid) -> Result<()>;
    pub async fn set_winners(&self, challenge_id: Uuid, winner_member_ids: Vec<Uuid>) -> Result<()>;

    // Backs the scheduled finalization job.
    pub async fn find_challenges_past_end_not_finalized(&self) -> Result<Vec<CommunityChallenge>>;
}

pub struct CommunityKudosRepository { db: Arc<Database> }

impl CommunityKudosRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn create(&self, community_id: Uuid, from_member_id: Uuid, to_member_id: Uuid, message: Option<String>) -> Result<KudosWithMembersDto>;
    pub async fn count_given_since(&self, from_member_id: Uuid, since: DateTime<Local>) -> Result<i64>;
    pub async fn list_received(&self, member_id: Uuid, page: i64, page_size: i64) -> Result<Vec<KudosWithMembersDto>>;
    pub async fn count_received(&self, member_id: Uuid) -> Result<i64>;
}
```

### Service (`backend/src/service/community_challenge_service.rs`)

- **Create challenge**: manager/owner only. Validates `end_at > start_at`;
  for `target` type requires `target_mode` and `target_minutes > 0`; for
  `leaderboard` type requires both to be absent (mirrors the DB
  `CHECK`, checked in the service first for a friendly message: "Target
  challenges need a target time and completion mode" / "Leaderboard
  challenges don't use a target time"). `tracked_category_id`, if set,
  validated same-community.
- **Join**: any member, any time before `end_at` (joining after start is
  fine — a challenge shouldn't punish late joiners the way a locked forum
  thread would, since the progress query naturally only counts minutes
  from their `session`s within the window regardless of when they
  joined). Joining after `end_at` is rejected: "This challenge has
  ended."
- **Leave**: a participant can leave any time before finalization; a
  finalized challenge's participant list is immutable (historical record).
- **Progress computation** (`compute_progress`): for each participant,
  sums `session.end_time - session.start_time` across sessions whose
  `category_id` maps (via `community_category_mapping`, joined through the
  participant's `community_member_id` → `user_id`) to the challenge's
  `tracked_category_id` (or *any* of the community's tracked categories if
  the challenge itself is community-wide with no category scope), and
  whose `start_time` falls within `[challenge.start_at, challenge.end_at]`
  (clamped to `now()` if the challenge is still active, i.e. progress is
  never computed past "now" for an in-flight challenge). For `target`
  type, any participant whose cumulative minutes crosses
  `target_minutes` gets `completed_at` set the first time this is
  observed (checked whenever `compute_progress` runs, which is triggered
  by every progress-view request — cheap because community + challenge
  sizes are small, same "no premature scale optimization" stance as v1).
- **Finalization** (`finalize_challenge`, called by the scheduled job for
  challenges past `end_at` with `status = 'active'`, or manually by
  manager/owner for early ending):
  - `leaderboard`: run `compute_progress`, winners = every participant
    tied for the maximum total minutes (ties produce multiple winners —
    concrete, no arbitrary tiebreak).
  - `target`, `first_to_reach`: winners = the single participant with the
    earliest `completed_at` (ties on the same timestamp — practically
    never, but if it happens, all tied participants win).
  - `target`, `all_who_reach`: winners = every participant with a non-null
    `completed_at`.
  - Sets `status = 'completed'`, `finalized_at = now()`, `is_winner = true`
    on winning participants, and emits `community:challenge_completed` to
    every participant (winners' notification content flags
    `you_won: true`), plus a `community_activity_event` with
    `event_type = 'challenge_completed'` naming the winner(s).
- **Cancel**: manager/owner only, any time before finalization —
  `status = 'cancelled'`, no winners computed, notifies participants.
- On creation, if `start_at <= now()` the challenge is immediately set
  `active` instead of `upcoming` and `community:challenge_started` is sent
  to all community members (not just participants — it's an invitation to
  join); if `start_at` is in the future, a lightweight follow-up check (the
  same scheduled job that finalizes past-end challenges also flips
  `upcoming` → `active` challenges whose `start_at` has passed) sends the
  same notification once the window opens.

### Service (`backend/src/service/community_kudos_service.rs`)

- **Give kudos**: actor and recipient must both be members of
  `community_id`; `from_member_id != to_member_id` (service-level check
  mirroring the DB constraint, with message "You can't give yourself
  kudos"). Rate limit: `count_given_since(actor_member_id, now() - 24h) <
  5`, otherwise reject with "You've given 5 kudos in the last 24 hours —
  try again later." On success: notify the recipient with
  `community:kudos_received` (content includes the giver's `ReadUserDto`
  and the message), insert `community_activity_event` with
  `event_type = 'kudos_given'`.

### DTOs

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateChallengeDto {
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub tracked_category_id: Option<Uuid>,
    pub challenge_type: ChallengeType,
    pub target_mode: Option<ChallengeTargetMode>,
    pub target_minutes: Option<i32>,
    pub start_at: DateTime<Local>,
    pub end_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct JoinChallengeDto {
    #[validate(length(max = 80))]
    pub team_name: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ChallengeProgressDto {
    pub member: ReadUserDto,
    pub team_name: Option<String>,
    pub total_minutes: i64,
    pub completed_at: Option<DateTime<Local>>,
    pub is_winner: bool,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct GiveKudosDto {
    pub to_member_id: Uuid,
    #[validate(length(max = 200))]
    pub message: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct KudosWithMembersDto {
    pub id: Uuid,
    pub from: ReadUserDto,
    pub to: ReadUserDto,
    pub message: Option<String>,
    pub created_at: DateTime<Local>,
}
```

### Router (`backend/src/router/community/challenge.rs`, `backend/src/router/community/kudos.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:id/challenges?status=` | `list_challenges_handler` | member | List challenges |
| POST | `/api/community/:id/challenges` | `create_challenge_handler` | manager/owner | Create a challenge |
| GET | `/api/community/:id/challenges/:challenge_id` | `get_challenge_handler` | member | Challenge detail |
| GET | `/api/community/:id/challenges/:challenge_id/progress` | `get_progress_handler` | member | Live standings/progress |
| POST | `/api/community/:id/challenges/:challenge_id/join` | `join_challenge_handler` | member | Join |
| DELETE | `/api/community/:id/challenges/:challenge_id/join` | `leave_challenge_handler` | participant | Leave |
| POST | `/api/community/:id/challenges/:challenge_id/finalize` | `finalize_challenge_handler` | manager/owner | End early |
| DELETE | `/api/community/:id/challenges/:challenge_id` | `cancel_challenge_handler` | manager/owner | Cancel |
| GET | `/api/community/:id/kudos/received/:member_id` | `list_received_kudos_handler` | member | A member's received kudos |
| POST | `/api/community/:id/kudos` | `give_kudos_handler` | member | Give kudos |

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, community_id = %community_id))]
async fn give_kudos_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<GiveKudosDto>,
) -> ApiResponse<KudosWithMembersDto> {
    let result = state
        .community_kudos_service
        .give_kudos(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/{communityChallenge,communityKudos}.ts`)

```ts
export const ChallengeTypeSchema = z.enum(["leaderboard", "target"]);
export const ChallengeTargetModeSchema = z.enum(["first_to_reach", "all_who_reach"]);
export const ChallengeStatusSchema = z.enum(["upcoming", "active", "completed", "cancelled"]);

export const CommunityChallengeSchema = z.object({
  id: z.string().uuid(),
  community_id: z.string().uuid(),
  tracked_category_id: z.string().uuid().nullable(),
  name: z.string().min(1).max(150),
  description: z.string().max(2000).nullable(),
  challenge_type: ChallengeTypeSchema,
  target_mode: ChallengeTargetModeSchema.nullable(),
  target_minutes: z.number().int().positive().nullable(),
  start_at: z.coerce.date<Date>(),
  end_at: z.coerce.date<Date>(),
  status: ChallengeStatusSchema,
});

export const ChallengeProgressSchema = z.object({
  member: ReadUserSchema,
  team_name: z.string().max(80).nullable(),
  total_minutes: z.number().int(),
  completed_at: z.coerce.date<Date>().nullable(),
  is_winner: z.boolean(),
});

const createChallenge = z
  .object({
    name: z.string().trim().min(1, "Name it").max(150),
    description: z.string().trim().max(2000).optional(),
    tracked_category_id: z.string().uuid().optional(),
    challenge_type: ChallengeTypeSchema,
    target_mode: ChallengeTargetModeSchema.optional(),
    target_minutes: z.number().int().positive().optional(),
    start_at: z.coerce.date<Date>(),
    end_at: z.coerce.date<Date>(),
  })
  .refine((data) => data.end_at > data.start_at, { message: "End must be after start", path: ["end_at"] })
  .refine(
    (data) => data.challenge_type !== "target" || (data.target_mode && data.target_minutes),
    { message: "Target challenges need a completion mode and a target time", path: ["target_minutes"] },
  );

export const CommunityChallengeRequestSchema = {
  createChallenge,
  join: z.object({ team_name: z.string().trim().max(80).optional() }),
};

export const CommunityKudosSchema = z.object({
  id: z.string().uuid(),
  from: ReadUserSchema,
  to: ReadUserSchema,
  message: z.string().max(200).nullable(),
  created_at: z.coerce.date<Date>(),
});

export const CommunityKudosRequestSchema = {
  give: z.object({
    to_member_id: z.string().uuid(),
    message: z.string().trim().max(200, "Keep it under 200 characters").optional(),
  }),
};
```

### API Client (`next-frontend/api/{communityChallengeApi,communityKudosApi}.ts`)

```ts
export const listChallenges = async (communityId: string, status?: string) => { ... };
export const createChallenge = async (communityId: string, params: CommunityChallengeRequest["createChallenge"]) => { ... };
export const getChallenge = async (communityId: string, challengeId: string) => { ... };
export const getChallengeProgress = async (communityId: string, challengeId: string) => { ... };
export const joinChallenge = async (communityId: string, challengeId: string, params: CommunityChallengeRequest["join"]) => { ... };
export const leaveChallenge = async (communityId: string, challengeId: string) => { ... };
export const finalizeChallenge = async (communityId: string, challengeId: string) => { ... };
export const cancelChallenge = async (communityId: string, challengeId: string) => { ... };

export const giveKudos = async (communityId: string, params: CommunityKudosRequest["give"]) => { ... };
export const listReceivedKudos = async (communityId: string, memberId: string, page?: number) => { ... };
```

### React Query Hooks (`next-frontend/components/hooks/{communityChallenge,communityKudos}/`)

- `useCommunityChallenges(communityId, status)` — `useQuery`.
- `useChallengeProgress(communityId, challengeId)` — `useQuery`, `refetchInterval: 30_000` while the challenge is `active` (live-ish standings without a websocket).
- `useCreateChallenge(communityId)` — `useMutation`, invalidates `challenges(communityId)`, toast "Challenge created".
- `useJoinChallenge(communityId, challengeId)` — `useMutation` with **optimistic update**: adds the current member to the cached progress list immediately with `total_minutes: 0`, rollback on failure.
- `useLeaveChallenge(communityId, challengeId)` — `useMutation`, optimistic removal.
- `useFinalizeChallenge(communityId)` / `useCancelChallenge(communityId)` — `useMutation`, invalidate on success.
- `useReceivedKudos(communityId, memberId)` — `useQuery`.
- `useGiveKudos(communityId)` — `useMutation` with **optimistic update**: increments the recipient's visible kudos count and prepends the new kudos to their received list if currently viewed, rollback on failure (this is the "sending kudos should feel instant" case named in the version's polish bar).

`queryKeys.communities` additions:

```ts
challenges: (communityId: string, status?: string) => ({
  queryKey: [communityId, "challenges", status ?? "any"],
  queryFn: async () => await CommunityChallengeApi.listChallenges(communityId, status),
}),
challengeProgress: (communityId: string, challengeId: string) => ({
  queryKey: [challengeId, "challenge-progress"],
  queryFn: async () => await CommunityChallengeApi.getChallengeProgress(communityId, challengeId),
}),
receivedKudos: (communityId: string, memberId: string) => ({
  queryKey: [memberId, "kudos-received"],
  queryFn: async () => await CommunityKudosApi.listReceivedKudos(communityId, memberId),
}),
```

### UI Components (`next-frontend/components/community/{challenges,kudos}/`)

- `ChallengeList.tsx` — grouped by status (Active, Upcoming, Completed), `ChallengeCard` per item.
- `ChallengeCard.tsx` — name, type badge (Leaderboard/Target), countdown or "ended" state, join button if not joined.
- `NewChallengeDialog.tsx` — form with a type toggle that conditionally reveals target-mode/target-minutes fields (Zod `.refine` mirrors this).
- `ChallengeDetail.tsx` — description, window, `ChallengeProgressList` or `ChallengeLeaderboardTable` depending on type, join/leave button, manager finalize/cancel controls.
- `ChallengeProgressList.tsx` — for `target` type: each participant's progress bar toward `target_minutes`, checkmark on `completed_at`.
- `ChallengeLeaderboardTable.tsx` — for `leaderboard` type: ranked table by `total_minutes`, winner crown icon once `status = 'completed'`.
- `GiveKudosButton.tsx` — small button on a member's profile/leaderboard row, opens `GiveKudosDialog`.
- `GiveKudosDialog.tsx` — short message textarea (200 char counter), submit.
- `KudosList.tsx` — a member's received kudos, message + giver + relative time.
- `KudosCountBadge.tsx` — small badge showing total kudos received, shown next to a member's name on the leaderboard/member list.

Primary user journey — giving kudos:

1. Member views the community's member list or leaderboard, sees `KudosCountBadge` and a `GiveKudosButton` next to another member's name.
2. Clicks it → `GiveKudosDialog` opens focused on the message textarea (optional field, can submit blank).
3. Submits → `useGiveKudos` optimistically increments that member's `KudosCountBadge` count wherever it's currently rendered and closes the dialog with a toast "Kudos sent to {name}".
4. If the rate limit is hit, the mutation fails, the badge count rolls back, and the toast explains the limit.
5. The recipient gets a `community:kudos_received` notification naming the giver and showing the message.

## UX & Polish

- **Loading state**: `ChallengeList` renders 3 skeleton cards grouped under skeleton section headers; `ChallengeProgressList`/`ChallengeLeaderboardTable` render 4 skeleton rows; `KudosList` renders 3 skeleton rows.
- **Empty state**:
  - No active challenges: heading "No active challenges", body "Start a time-based challenge to get the community competing." primary button **New challenge** (manager/owner only; members see the same heading with body "No active challenges right now — check back soon." and no button).
  - No kudos given yet (on a member's profile): "No kudos yet — be the first to recognize {name}'s work."
- **Error states** (toast copy):
  - Kudos rate limit: title "Slow down a little", description "You've given 5 kudos in the last 24 hours — try again later."
  - Kudos to self somehow reaches the server (UI should prevent showing the button on your own profile, but defense in depth): title "Couldn't send kudos", description "You can't give yourself kudos."
  - Join challenge after it ended: title "Couldn't join challenge", description "This challenge has already ended."
  - Create challenge fails target-field validation server-side: title "Couldn't create challenge", description server message.
- **Optimistic updates**: giving kudos, joining/leaving a challenge all feel instant with rollback on failure, per the version's polish bar; challenge creation/finalization/cancellation are not optimistic (state changes visible to the whole community, wait for confirmation).
- **Responsive (mobile)**: `ChallengeLeaderboardTable` collapses to a stacked card-per-participant layout (rank badge, name, minutes, progress) instead of a horizontal table under `md`; `ChallengeCard` grid goes to a single column; `GiveKudosDialog` is a bottom sheet on mobile.
- **Accessibility**: challenge type and status are conveyed with icon + text badges, not color alone (e.g. "Active" green pill also has an "● Active" text, "Completed" has a checkmark icon); `ChallengeProgressList` progress bars have `aria-valuenow`/`aria-valuemax` and a visually-hidden text equivalent ("42 of 100 minutes"); `GiveKudosButton` has an `aria-label` like "Give kudos to {name}"; the 200-character counter in `GiveKudosDialog` is announced via `aria-live="polite"` as it updates, not just visually.

## Acceptance Criteria

- [ ] Only manager/owner can create, finalize-early, or cancel a challenge.
- [ ] A `target`-type challenge requires `target_mode` and `target_minutes`; a `leaderboard`-type challenge rejects both being set — enforced client- and server-side.
- [ ] A member can join a challenge before `end_at`; joining after `end_at` is rejected.
- [ ] Progress/standings are computed from actual session data via the existing category-mapping join, not a separately-maintained counter that can drift.
- [ ] Finalizing a `leaderboard` challenge marks every tied-for-first participant as a winner.
- [ ] Finalizing a `target`/`first_to_reach` challenge marks only the earliest-completing participant(s) as winners; `all_who_reach` marks everyone who hit the target.
- [ ] A member can give kudos to another member but not to themselves.
- [ ] A member is blocked from giving a 6th kudos within a rolling 24-hour window, with a clear error.
- [ ] Giving kudos and finalizing a challenge each emit the appropriate `community_activity_event` and notifications.

## Testing Notes

- Backend (`cargo test`):
  - `community_challenge_service`:
    - `create_target_challenge_requires_mode_and_minutes` — omits `target_minutes`, asserts `Err`.
    - `create_leaderboard_challenge_rejects_target_fields` — sets `target_minutes`, asserts `Err`.
    - `join_rejected_after_challenge_ended`.
    - `finalize_leaderboard_challenge_ties_produce_multiple_winners` — seeds two participants with identical `total_minutes`, asserts both `is_winner = true`.
    - `finalize_target_first_to_reach_picks_earliest_completer` — seeds two participants with different `completed_at`, asserts only the earlier is `is_winner`.
    - `finalize_target_all_who_reach_marks_everyone_who_completed`.
    - `finalize_is_idempotent` — calling finalize twice doesn't double-notify or change the winner set (guarded by `status != 'active'` check).
  - `community_kudos_service`:
    - `member_can_give_kudos_to_another_member`.
    - `cannot_give_kudos_to_self` — asserts `Err`.
    - `rate_limit_blocks_sixth_kudos_within_24h` — seeds 5 kudos in the last hour, attempts a 6th, asserts `Err`; seeds one kudos 25 hours ago plus 4 within the window, attempts a 6th, asserts success (rolling window, not calendar-day).
    - `kudos_notifies_recipient` — spy/mock assertion.
- Frontend (Storybook stories under `next-frontend/stories/community/{challenges,kudos}/`):
  - `ChallengeCard.stories.tsx` — Upcoming, ActiveLeaderboard, ActiveTarget, Completed, CompletedWithWinner.
  - `ChallengeLeaderboardTable.stories.tsx` — Default, TiedWinners, Loading, Empty.
  - `ChallengeProgressList.stories.tsx` — InProgress, SomeCompleted, NoneJoined.
  - `NewChallengeDialog.stories.tsx` — LeaderboardType, TargetType, ValidationErrorMissingTargetFields.
  - `GiveKudosDialog.stories.tsx` — Default, CharacterLimitReached, RateLimitError.
  - `KudosList.stories.tsx` — Default, Empty.
