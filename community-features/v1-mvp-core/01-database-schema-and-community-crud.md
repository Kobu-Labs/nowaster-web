# Step 1: Database Schema and Community CRUD

## Overview

This step introduces the `community` table — the root entity every later
Communities feature hangs off of — and delivers full create/read/update/
archive (soft-delete) functionality end-to-end, including the UI a user sees
to create a community and manage its settings. There is no membership,
category tracking, or aggregation yet; a community at the end of this step is
just a named, owned, configurable container. Nothing in this step depends on
earlier work (it's the first step of v1), but every later v1 step depends on
the `community` table and `CommunityService` this step creates.

## Scope

- In scope:
  - `community` table + migration
  - `Community` entity, `CommunityVisibilityType` / `CommunityDataVisibility`
    enums
  - Create, get-by-id, update, archive (soft delete), list-owned-by-me
    endpoints
  - Owner-only permission checks (only the creator can update/archive)
  - Frontend: Zod schemas, API client, React Query hooks, create dialog, edit
    form, community list page, community detail shell page
- Explicitly deferred:
  - Membership beyond the implicit owner (→ Step 2, this step only writes
    `owner_id` on `community`)
  - Invite codes (→ Step 2)
  - Tracked categories (→ Step 3)
  - Any aggregation/dashboard data (→ Step 4)
  - Hard delete of a community (never in v1 — archive only)
  - Transferring ownership (→ v2, per the roadmap's manager-role step)

## Data Model

- Migration filename: `backend/migrations/0057_create_community.sql`

```sql
-- backend/migrations/0057_create_community.sql

CREATE TYPE community_visibility_type AS ENUM ('public', 'invite_only');
CREATE TYPE community_data_visibility AS ENUM ('public', 'members_only');

CREATE TABLE IF NOT EXISTS "community" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,

    visibility_type community_visibility_type NOT NULL DEFAULT 'invite_only',
    data_visibility community_data_visibility NOT NULL DEFAULT 'members_only',

    owner_id TEXT NOT NULL,

    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_owner
        FOREIGN KEY (owner_id) REFERENCES "user"(id),
    CONSTRAINT community_name_length
        CHECK (char_length(name) BETWEEN 1 AND 80),
    CONSTRAINT community_description_length
        CHECK (description IS NULL OR char_length(description) <= 2000)
);

CREATE INDEX idx_community_owner_id ON "community"(owner_id);
-- Speeds up "browse public communities" style queries; only cheap now, pays
-- off directly when v2 adds discovery.
CREATE INDEX idx_community_visibility_type ON "community"(visibility_type)
    WHERE archived_at IS NULL;
```

Notes:
- `owner_id` is `TEXT REFERENCES "user"(id)`, matching `User.id: String`.
- No `ON DELETE CASCADE` on `owner_id` — users are never hard-deleted in this
  codebase (there's no such flow today), so this mirrors existing FK style
  (e.g. `friend_request.requestor_id`).
- `archived_at IS NULL` is the "active" predicate everywhere; there is no
  boolean `is_archived` column to avoid a second source of truth.
- `updated_at` is maintained by the application (repository sets `NOW()` on
  every `UPDATE`), matching how `friend_request.updated_at` is handled — no
  DB trigger is introduced, consistent with the rest of the schema.

Rust entity — `backend/src/entity/community.rs` (new file):

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use sqlx::Type;
use uuid::Uuid;

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq)]
#[sqlx(type_name = "community_visibility_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityVisibilityType {
    Public,
    InviteOnly,
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug, Type, PartialEq, Eq)]
#[sqlx(type_name = "community_data_visibility", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityDataVisibility {
    Public,
    MembersOnly,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct Community {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: CommunityVisibilityType,
    pub data_visibility: CommunityDataVisibility,
    pub owner_id: String,
    pub archived_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

impl Community {
    pub fn is_archived(&self) -> bool {
        self.archived_at.is_some()
    }
}
```

Register the module in `backend/src/entity/mod.rs`: `pub mod community;`.

## Backend Implementation

### Repository (`backend/src/repository/community.rs`)

```rust
#[derive(Clone)]
pub struct CommunityRepository { db: Arc<Database> }
```

- `pub fn new(db_conn: &Arc<Database>) -> Self` — standard constructor.
- `pub async fn create(&self, dto: CreateCommunityDto, owner_id: &str) -> Result<Community>` —
  inserts a row with `owner_id` and returns the created community.
- `pub async fn find_by_id(&self, id: Uuid) -> Result<Option<Community>>` —
  fetches a single community regardless of archived state (callers decide
  what "not found" means for their use case).
- `pub async fn update(&self, dto: UpdateCommunityDto) -> Result<Community>` —
  `UPDATE ... SET updated_at = NOW() WHERE id = $1 AND archived_at IS NULL RETURNING *`;
  only non-`None` fields on the DTO are applied (partial update, same pattern
  as `UpdateCategoryDto`/`UpdateProjectDto`).
- `pub async fn archive(&self, id: Uuid) -> Result<Community>` —
  `UPDATE community SET archived_at = NOW(), updated_at = NOW() WHERE id = $1 AND archived_at IS NULL RETURNING *`.
- `pub async fn list_owned_by(&self, owner_id: &str) -> Result<Vec<Community>>` —
  `WHERE owner_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`.
  (Step 2 replaces the call site of this with a membership-based query; this
  method stays and becomes one part of that later join.)

### Service (`backend/src/service/community_service.rs`)

Business rules enforced here (repository stays query-only, matching
`friend_service.rs`/`category_service.rs`):

- **Create**: any authenticated user may create a community. The actor
  becomes `owner_id`. No cap on communities-per-user in v1.
- **Update**: only `community.owner_id == actor.user_id` may update. Returns
  `Err(anyhow!("You are not allowed to update this community"))` otherwise —
  same phrasing style as `category_service::update_category`.
- **Archive**: owner-only, same error message pattern
  (`"You are not allowed to archive this community"`). Archiving an
  already-archived community returns
  `Err(anyhow!("This community is already archived"))`.
- **Get by id**: if the community is archived, only the owner may still see
  it (so the owner can review it), everyone else gets
  `Err(anyhow!("Community not found"))` — archived communities are
  functionally invisible to non-owners, matching how "not found" is
  communicated elsewhere in the codebase (no distinct 404 type; errors are
  strings surfaced via `ApiResponse::Error`).
- **List mine**: returns communities owned by the actor. (Step 2 will widen
  this to "communities I'm a member of, including ones I don't own.")

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateCommunityDto {
    #[validate(length(min = 1, max = 80))]
    pub name: String,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: CommunityVisibilityType,
    pub data_visibility: CommunityDataVisibility,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateCommunityDto {
    pub id: Uuid,
    #[validate(length(min = 1, max = 80))]
    pub name: Option<String>,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: Option<CommunityVisibilityType>,
    pub data_visibility: Option<CommunityDataVisibility>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCommunityDto {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: CommunityVisibilityType,
    pub data_visibility: CommunityDataVisibility,
    pub owner_id: String,
    pub is_owner: bool, // computed against the requesting actor
    pub archived_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
}
```

`CommunityService` holds a `CommunityRepository`; method signatures:

- `pub async fn create_community(&self, dto: CreateCommunityDto, actor: &Actor) -> Result<ReadCommunityDto>`
- `pub async fn get_community(&self, id: Uuid, actor: &Actor) -> Result<ReadCommunityDto>`
- `pub async fn update_community(&self, dto: UpdateCommunityDto, actor: &Actor) -> Result<ReadCommunityDto>`
- `pub async fn archive_community(&self, id: Uuid, actor: &Actor) -> Result<()>`
- `pub async fn list_my_communities(&self, actor: &Actor) -> Result<Vec<ReadCommunityDto>>`

### DTOs (`backend/src/dto/...`)

The DTOs above (`CreateCommunityDto`, `UpdateCommunityDto`, `ReadCommunityDto`)
live in the service module for now, mirroring how `friend_service.rs` keeps
its request/response DTOs alongside the trait rather than in `dto/` — this
codebase is inconsistent between `dto/` (category, tag, session, project,
task) and in-service DTOs (friend). Community follows the `dto/` convention
since it's a brand-new resource with its own CRUD surface, same as category:

- `backend/src/dto/community/create_community.rs` → `CreateCommunityDto`
- `backend/src/dto/community/update_community.rs` → `UpdateCommunityDto`
- `backend/src/dto/community/read_community.rs` → `ReadCommunityDto`
- `backend/src/dto/community/mod.rs` → `pub mod create_community; pub mod update_community; pub mod read_community;`

Add `pub mod community;` to `backend/src/dto/mod.rs`.

### Router (`backend/src/router/community/root.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/community` | `create_community_handler` | required | Create a community; actor becomes owner |
| GET | `/api/community` | `list_my_communities_handler` | required | List communities the actor owns |
| GET | `/api/community/{community_id}` | `get_community_handler` | required | Fetch one community (visible to owner always; to others only if not archived) |
| PATCH | `/api/community/{community_id}` | `update_community_handler` | required, owner only | Update name/description/avatar/visibility |
| DELETE | `/api/community/{community_id}` | `archive_community_handler` | required, owner only | Soft-delete (sets `archived_at`) |

```rust
// backend/src/router/community/root.rs
use axum::{
    extract::{Path, State},
    routing::get,
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    dto::community::{
        create_community::CreateCommunityDto, read_community::ReadCommunityDto,
        update_community::UpdateCommunityDto,
    },
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
};

pub fn community_router() -> Router<AppState> {
    Router::new()
        .route(
            "/",
            get(list_my_communities_handler).post(create_community_handler),
        )
        .route(
            "/{community_id}",
            get(get_community_handler)
                .patch(update_community_handler)
                .delete(archive_community_handler),
        )
}

#[instrument(skip(state), fields(user_id = %actor, community_name = %payload.name))]
async fn create_community_handler(
    State(state): State<AppState>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateCommunityDto>,
) -> ApiResponse<ReadCommunityDto> {
    let result = state
        .community_service
        .create_community(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor))]
async fn list_my_communities_handler(
    State(state): State<AppState>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCommunityDto>> {
    let result = state.community_service.list_my_communities(&actor).await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn get_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<ReadCommunityDto> {
    let result = state
        .community_service
        .get_community(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn update_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<UpdateCommunityDto>,
) -> ApiResponse<ReadCommunityDto> {
    payload.id = community_id;
    let result = state
        .community_service
        .update_community(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn archive_community_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<()> {
    let result = state
        .community_service
        .archive_community(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

Wiring: `backend/src/router/community/mod.rs` gets `pub mod root;`. In
`backend/src/router/root.rs`: add `community_service: CommunityService` to
`AppState`, construct it (`CommunityService::new(community_repo)`) next to
`category_service`, and add
`.nest("/community", community_router().with_state(state.clone()))` to the
`protected_routes` router, alongside the existing `/friends`, `/category`
nests.

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/community.ts`)

`next-frontend/api/definitions/models/community.ts`:

```ts
import { z } from "zod";
import { HasID } from "@/validation/utils";

export const CommunityVisibilityTypeSchema = z.enum(["public", "invite_only"]);
export const CommunityDataVisibilitySchema = z.enum(["public", "members_only"]);

export const CommunitySchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(2000).nullable(),
  avatar_url: z.string().nullable(),
  visibility_type: CommunityVisibilityTypeSchema,
  data_visibility: CommunityDataVisibilitySchema,
  owner_id: z.string(),
  is_owner: z.boolean(),
  archived_at: z.coerce.date<Date>().nullable(),
  created_at: z.coerce.date<Date>(),
});

export const CommunityWithIdSchema = CommunitySchema.merge(HasID);

export type Community = z.infer<typeof CommunitySchema>;
export type CommunityWithId = z.infer<typeof CommunityWithIdSchema>;
export type CommunityVisibilityType = z.infer<typeof CommunityVisibilityTypeSchema>;
export type CommunityDataVisibility = z.infer<typeof CommunityDataVisibilitySchema>;
```

`next-frontend/api/definitions/requests/community.ts`:

```ts
import { z } from "zod";
import {
  CommunityDataVisibilitySchema,
  CommunityVisibilityTypeSchema,
} from "@/api/definitions/models/community";

const create = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  visibilityType: CommunityVisibilityTypeSchema,
  dataVisibility: CommunityDataVisibilitySchema,
});

const update = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
  visibilityType: CommunityVisibilityTypeSchema.optional(),
  dataVisibility: CommunityDataVisibilitySchema.optional(),
});

const archive = z.object({ id: z.uuid() });
const getById = z.object({ id: z.uuid() });

export const CommunityRequestSchema = { create, update, archive, getById };
export type CommunityRequest = {
  [Property in keyof typeof CommunityRequestSchema]: z.infer<
    (typeof CommunityRequestSchema)[Property]
  >;
};
```

`next-frontend/api/definitions/responses/community.ts`:

```ts
import { z } from "zod";
import { CommunityWithIdSchema } from "@/api/definitions/models/community";

export const CommunityResponseSchema = {
  create: CommunityWithIdSchema,
  getById: CommunityWithIdSchema,
  update: CommunityWithIdSchema,
  archive: z.null(),
  listMine: z.array(CommunityWithIdSchema),
};
export type CommunityResponse = {
  [Property in keyof typeof CommunityResponseSchema]: z.infer<
    (typeof CommunityResponseSchema)[Property]
  >;
};
```

Add exports in `next-frontend/api/definitions/index.ts` re-export barrels
(`models`, `requests`, `responses` index files) — follow the existing pattern
used for `category.ts`.

### API Client (`next-frontend/api/communityApi.ts`)

```ts
import baseApi, { parseResponseUnsafe } from "@/api/baseApi";
import type { CommunityRequest } from "@/api/definitions";
import { CommunityResponseSchema } from "@/api/definitions";

const BASE_URL = "/community";

export const listMine = async () => {
  const { data } = await baseApi.get(BASE_URL);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMine);
};

export const getById = async (params: CommunityRequest["getById"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.getById);
};

export const create = async (params: CommunityRequest["create"]) => {
  const { data } = await baseApi.post(BASE_URL, params);
  return await parseResponseUnsafe(data, CommunityResponseSchema.create);
};

export const update = async (params: CommunityRequest["update"]) => {
  const { data } = await baseApi.patch(`${BASE_URL}/${params.id}`, params);
  return await parseResponseUnsafe(data, CommunityResponseSchema.update);
};

export const archive = async (params: CommunityRequest["archive"]) => {
  const { data } = await baseApi.delete(`${BASE_URL}/${params.id}`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.archive);
};
```

Register `CommunityApi` in the central `next-frontend/api/index.ts` barrel
next to `CategoryApi`, `ProjectsApi`, etc.

### React Query Hooks (`next-frontend/components/hooks/community/...`)

`queryKeys.communities` addition in
`next-frontend/components/hooks/queryHooks/queryKeys.ts`:

```ts
const communityKeys = createQueryKeys("communities", {
  mine: {
    queryFn: async () => await CommunityApi.listMine(),
    queryKey: ["mine"],
  },
  byId: (id: string) => ({
    queryFn: async () => await CommunityApi.getById({ id }),
    queryKey: [id],
  }),
});
```
...merged into `mergeQueryKeys(..., communityKeys)`.

Hooks:
- `useMyCommunities.ts` → `useMyCommunities()` — `useQuery(queryKeys.communities.mine)`.
- `useCommunityById.ts` → `useCommunityById(id: string)` — `useQuery(queryKeys.communities.byId(id))`, `enabled: !!id`.
- `useCreateCommunity.tsx` → `useCreateCommunity()` — mutation wrapping `CommunityApi.create`; on success invalidates `queryKeys.communities.mine._def` and toasts `"Community created"` with the name; on error toasts `error.message` under title `"Error creating community"` (matches `useCreateProject` exactly).
- `useUpdateCommunity.tsx` → `useUpdateCommunity()` — mutation wrapping `CommunityApi.update`; on success invalidates `queryKeys.communities.byId(id)._def` and `queryKeys.communities.mine._def`, toasts `"Community updated"`.
- `useArchiveCommunity.tsx` → `useArchiveCommunity()` — mutation wrapping `CommunityApi.archive`; invalidates `queryKeys.communities.mine._def` on success, toasts `"Community archived"`; error toast title `"Error archiving community"`.

### UI Components

- `next-frontend/app/home/communities/page.tsx` — server-thin page shell rendering `<CommunityList />`.
- `next-frontend/app/home/communities/[id]/page.tsx` — page shell rendering `<CommunityDetailPage id={params.id} />`.
- `next-frontend/components/visualizers/communities/CommunityList.tsx` — grid of `CommunityCard`s for `useMyCommunities()`, houses `<CreateCommunityDialog />` as its header action, handles loading/empty states.
- `next-frontend/components/visualizers/communities/CommunityCard.tsx` — one community's summary (avatar, name, role badge "Owner", visibility badge); click navigates to `/home/communities/[id]`.
- `next-frontend/components/visualizers/communities/CreateCommunityDialog.tsx` — `react-hook-form` + `zodResolver` dialog form, structurally identical to `CreateProjectDialog.tsx` (name, description textarea, visibility-type radio group, data-visibility radio group).
- `next-frontend/components/visualizers/communities/CommunityDetailPage.tsx` — fetches `useCommunityById`, renders header (avatar, name, description) plus an `<EditCommunitySettingsForm />` and `<ArchiveCommunityButton />` when `is_owner`; read-only summary otherwise. (Membership, mapping, and dashboard sections are added by later steps into this same file.)
- `next-frontend/components/visualizers/communities/EditCommunitySettingsForm.tsx` — inline-editable form (same field set as create) that calls `useUpdateCommunity`.
- `next-frontend/components/visualizers/communities/ArchiveCommunityButton.tsx` — button that opens an `AlertDialog` confirmation (same structure as the "Remove Friend" alert dialog in `FriendsList.tsx`) before calling `useArchiveCommunity`.

**User journey — create and configure a community:**

1. User opens the sidebar and clicks "Communities", landing on `/home/communities`. They see a grid of communities they own (empty on first visit).
2. User clicks "New Community" in the list header, opening `CreateCommunityDialog`.
3. User types a name ("Faculty of Informatics"), an optional description, picks "Invite only" for visibility type and "Members only" for data visibility (the form's defaults), and clicks "Create".
4. The dialog closes optimally after success; a toast confirms creation; the new community appears in the grid immediately (query invalidation refetches `communities.mine`).
5. User clicks the new `CommunityCard`, navigating to `/home/communities/[id]`.
6. As owner, they see an "Edit" affordance next to the header; clicking it reveals `EditCommunitySettingsForm` inline, pre-filled with current values.
7. User changes the description and saves; a toast confirms "Community updated"; the header re-renders with the new description.
8. User scrolls to the danger zone and clicks "Archive Community"; a confirmation dialog explains this hides the community from members' community switching and cannot be undone from the UI; confirming calls `useArchiveCommunity` and redirects back to `/home/communities`.

## UX & Polish

- **Loading state**: `CommunityList` shows 3 skeleton `CommunityCard`-shaped placeholders (`Skeleton` from `components/shadcn/skeleton`, sized to match the real card: avatar circle + two text lines) while `useMyCommunities` is loading. `CommunityDetailPage` shows a skeleton header (avatar + two text bars) plus a skeleton settings block while `useCommunityById` is loading.
- **Empty state**: When `useMyCommunities` resolves to `[]`, `CommunityList` shows a centered block: heading **"You haven't started a community yet"**, body copy **"Communities let you track time together with people learning or working on the same things. Create one to get started."**, and a `Users` (lucide-react) icon at 48px above the text, with the "New Community" button repeated inline below the copy.
- **Error states**:
  - Create failure → toast title `"Error creating community"`, description = `error.message` (server message, e.g. `"Name is required"` bubbles from Zod validation before it ever reaches the server; server-side failures like a DB error surface as `"Something went wrong creating your community. Try again."` — the service wraps unexpected DB errors with this friendly message rather than leaking `anyhow` internals).
  - Update failure → toast title `"Error updating community"`.
  - Archive failure → toast title `"Error archiving community"`, e.g. body `"Only the owner can archive this community"` when the 403-equivalent path is hit (defensive; the UI already hides the button from non-owners).
  - Inline validation: name empty → `"Name is required"` under the field; name > 80 chars → `"Name must be 80 characters or fewer"`; both rendered via `FormMessage`.
- **Optimistic update**: Archive is the one action here a user expects to feel instant (they're removing something from a list they're staring at). `useArchiveCommunity` optimistically removes the community from the `communities.mine` cache in `onMutate` (matching the `useCreateStopwatchSession` pattern: cancel in-flight queries, snapshot previous data, splice out the archived id, return the snapshot as context), and restores the snapshot in `onError`. Create/update are not optimistic — they require a server-generated `id`/timestamps the UI can't fabricate meaningfully, and the round trip is already fast; instead they show a `loading` spinner on the submit button (`Button`'s `loading` prop, already used in `CreateProjectDialog`).
- **Responsive**: `CommunityList` grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. `CreateCommunityDialog` and `EditCommunitySettingsForm` fields stack full-width below `sm`. `CommunityDetailPage` header switches from a horizontal avatar+text row to a stacked centered layout below `sm`.
- **Accessibility**: Dialog traps focus on open and returns focus to the trigger button on close (shadcn `Dialog` default behavior — verify `onInteractOutside` isn't suppressing escape-to-close, matching `CreateProjectDialog`'s pattern of only blocking outside-click). Visibility-type and data-visibility fields use a `RadioGroup` with visible text labels (not icon-only) so the state doesn't rely on color. The archive confirmation `AlertDialog` moves focus to its "Cancel" button on open (safe default action gets focus, not the destructive one). All interactive elements are reachable via Tab in visual order; the "Edit" toggle is a real `<button>` with `aria-expanded` reflecting whether the form is open.

## Acceptance Criteria

- [ ] Migration `0057_create_community.sql` applies cleanly on top of `0056`.
- [ ] A user can create a community via `POST /api/community` and becomes its owner.
- [ ] `GET /api/community` returns only communities the actor owns.
- [ ] `GET /api/community/{id}` returns the community for its owner even if archived; returns an error for non-owners once archived.
- [ ] `PATCH /api/community/{id}` by a non-owner returns an error and makes no change.
- [ ] `PATCH /api/community/{id}` by the owner updates only the supplied fields.
- [ ] `DELETE /api/community/{id}` by the owner sets `archived_at` and the community disappears from `GET /api/community` for everyone but the owner.
- [ ] `DELETE /api/community/{id}` on an already-archived community returns an error, not a silent no-op.
- [ ] Frontend: creating a community from `CreateCommunityDialog` shows it in `CommunityList` without a manual refresh.
- [ ] Frontend: archiving a community removes it from the list immediately (optimistic) and permanently after refetch.
- [ ] Frontend: a non-owner viewing `/home/communities/[id]` (reachable only if later steps expose it via membership) never sees the Edit/Archive affordances.

## Testing Notes

- Backend (`backend/src/service/community_service.rs` or a `tests/` integration module, following existing test file placement conventions):
  - `create_community_sets_actor_as_owner` — asserts `owner_id == actor.user_id` and `is_owner == true` on the returned DTO.
  - `update_community_by_non_owner_is_rejected` — asserts `Err` and that the underlying row is unchanged.
  - `update_community_partial_fields_only_changes_supplied_fields` — update only `description`, assert `name` untouched.
  - `archive_community_hides_it_from_list_owned_by_for_non_owners` — after archiving, `list_owned_by` for a different actor (n/a since only owner can list-mine in this step, but assert `get_community` as a second user returns `Err`).
  - `archive_already_archived_community_returns_error`.
  - `get_community_by_id_not_found_returns_error` for a random `Uuid`.
- Frontend (Storybook):
  - `CommunityCard.stories.tsx` — states: owner badge shown, member (non-owner) view, archived (should not normally render but cover defensively), public vs. invite-only badge variants.
  - `CreateCommunityDialog.stories.tsx` — default/empty, validation-error (submit with empty name), submitting (loading button state).
  - `CommunityList.stories.tsx` — loading (skeletons), empty state, populated grid (3+ cards, responsive at mobile viewport via Storybook viewport addon).
  - `EditCommunitySettingsForm.stories.tsx` — default populated, submitting state, server-error toast triggered.
