# Step 3: Category/Tag Mapping

## Overview

This step lets a community define the buckets it wants to track ("tracked
categories" — e.g. "Algorithms", "Databases") and lets each member connect
their own personal categories to those buckets, per the locked design
decision in the roadmap README (option 2: personal categories stay untouched;
communities define their own named buckets; members map their categories
into them). It depends on `community` (Step 1) and `community_member`
(Step 2) — only members can create mappings, and only the owner can define
tracked categories. This step does not compute or display any aggregated
time yet; that's Step 4, which reads the mapping table this step creates.

## Scope

- In scope:
  - `community_tracked_category` table (owner-managed, name + color, no
    reuse of any user's personal categories)
  - `community_category_mapping` table (per-member, many-to-many: a personal
    category can map to multiple tracked categories, and a tracked category
    can receive mappings from multiple personal categories across members)
  - Owner CRUD for tracked categories
  - Member CRUD for their own mappings (a member can only see/edit their own
    mappings, never another member's)
  - The "connect your categories" UI a new member sees, plus an ongoing
    mapping management view
- Explicitly deferred:
  - Suggest-a-match by name similarity (mentioned as a nice-to-have in the
    roadmap README, not required for v1)
  - Any aggregation reading this data (→ Step 4, same version, next step)
  - Tag-level tracking (only categories are tracked in v1; tags are out of
    scope for the whole Communities feature through v4 per the planning doc)
  - Bulk category management / mass mapping tools (→ v4 per the roadmap's
    "Bulk Operations" idea)

## Data Model

- Migration filename: `backend/migrations/0059_create_community_tracked_categories.sql`

```sql
-- backend/migrations/0059_create_community_tracked_categories.sql

CREATE TABLE IF NOT EXISTS "community_tracked_category" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_tracked_category_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT uq_community_tracked_category_name
        UNIQUE (community_id, name),
    CONSTRAINT community_tracked_category_name_length
        CHECK (char_length(name) BETWEEN 1 AND 60)
);

CREATE INDEX idx_community_tracked_category_community_id
    ON "community_tracked_category"(community_id);

CREATE TABLE IF NOT EXISTS "community_category_mapping" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL,
    tracked_category_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    personal_category_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ccm_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccm_tracked_category
        FOREIGN KEY (tracked_category_id) REFERENCES "community_tracked_category"(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccm_user
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccm_personal_category
        FOREIGN KEY (personal_category_id) REFERENCES "category"(id) ON DELETE CASCADE,
    CONSTRAINT uq_ccm_no_duplicate_mapping
        UNIQUE (tracked_category_id, user_id, personal_category_id)
);

CREATE INDEX idx_ccm_community_user ON "community_category_mapping"(community_id, user_id);
CREATE INDEX idx_ccm_personal_category ON "community_category_mapping"(personal_category_id);
CREATE INDEX idx_ccm_tracked_category ON "community_category_mapping"(tracked_category_id);
```

Design notes:
- `community_tracked_category.color` is a plain hex string, same convention
  as `category.color`/`tag.color` (`TEXT`, no `CHECK` on format — the
  existing `category`/`tag` tables don't constrain color format either, so
  this stays consistent rather than introducing a new rule).
- `community_category_mapping` intentionally has no FK-level constraint
  tying `personal_category_id`'s owner to `user_id` — that invariant (a user
  can only map *their own* categories) is enforced in the service layer,
  matching how `category_service::update_category` checks
  `category.created_by != actor.user_id` rather than expressing it in SQL.
  A DB-level check would need a subquery-based constraint or trigger, which
  nothing else in this schema uses.
- `personal_category_id REFERENCES "category"(id) ON DELETE CASCADE` means
  if a user deletes a personal category they'd mapped, the mapping silently
  disappears too — no orphaned mapping, no dangling reference. This is the
  desired behavior: the mapping only ever makes sense in the context of a
  category that exists.

Rust entities — `backend/src/entity/community_category.rs` (new file):

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityTrackedCategory {
    pub id: Uuid,
    pub community_id: Uuid,
    pub name: String,
    pub color: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunityCategoryMapping {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Uuid,
    pub user_id: String,
    pub personal_category_id: Uuid,
    pub created_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_category.rs`, new file)

```rust
#[derive(Clone)]
pub struct CommunityCategoryRepository { db: Arc<Database> }
```

- `pub fn new(db_conn: &Arc<Database>) -> Self`
- `pub async fn create_tracked_category(&self, community_id: Uuid, name: &str, color: &str) -> Result<CommunityTrackedCategory>` —
  plain insert; unique constraint on `(community_id, name)` surfaces as a DB
  error the service maps to a friendly message (see Service section).
- `pub async fn update_tracked_category(&self, id: Uuid, name: Option<&str>, color: Option<&str>) -> Result<CommunityTrackedCategory>` —
  partial `UPDATE ... SET updated_at = NOW() WHERE id = $1 RETURNING *`.
- `pub async fn delete_tracked_category(&self, id: Uuid) -> Result<()>` —
  cascades to `community_category_mapping` rows via the FK.
- `pub async fn find_tracked_category(&self, id: Uuid) -> Result<Option<CommunityTrackedCategory>>`
- `pub async fn list_tracked_categories(&self, community_id: Uuid) -> Result<Vec<CommunityTrackedCategory>>` —
  ordered by `name ASC`.
- `pub async fn create_mapping(&self, community_id: Uuid, tracked_category_id: Uuid, user_id: &str, personal_category_id: Uuid) -> Result<CommunityCategoryMapping>` —
  plain insert.
- `pub async fn delete_mapping(&self, id: Uuid, user_id: &str) -> Result<()>` —
  `DELETE ... WHERE id = $1 AND user_id = $2`, so a user can only ever delete
  their own row (defense in depth alongside the service-layer check).
- `pub async fn find_mapping(&self, id: Uuid) -> Result<Option<CommunityCategoryMapping>>`
- `pub async fn list_mappings_for_member(&self, community_id: Uuid, user_id: &str) -> Result<Vec<CommunityCategoryMappingDetailDto>>` —
  joins to `community_tracked_category` (name, color) and `category`
  (name, color) so the UI can render a mapping row without N+1 fetches.
- `pub async fn list_all_mappings_for_community(&self, community_id: Uuid) -> Result<Vec<CommunityCategoryMapping>>` —
  used by Step 4's aggregation, added here since it's a pure query with no
  new business logic.

### Service (`backend/src/service/community_category_service.rs`, new file — earns its own service per the roadmap README's convention of splitting sub-resources into their own service once they justify it)

Business rules:

- **Create tracked category**: owner-only
  (`Err(anyhow!("Only the owner can manage tracked categories"))`
  otherwise). Duplicate name within the same community →
  `Err(anyhow!("This community already tracks a category named \"{name}\""))`
  (the service catches the unique-violation DB error and translates it,
  matching how `create_friend_request` pre-checks rather than lets a raw
  constraint error bubble as an opaque message).
- **Update/delete tracked category**: owner-only, same error phrasing.
  Deleting a tracked category also deletes every member's mappings to it
  (DB cascade) — the service surfaces a confirmation requirement to the
  frontend via response metadata (`mapped_member_count` returned before
  delete, see DTOs) rather than blocking the delete outright, since v1 has
  no moderation/undo story and blocking would just be friction.
- **List tracked categories**: any member (or public if
  `data_visibility == Public`, mirroring Step 2's member-list visibility
  rule — tracked categories are considered part of the community's public
  shape, same visibility tier as the member list).
- **Create mapping**: actor must be a member of the community
  (`Err(anyhow!("You must be a member to map categories in this community"))`).
  `personal_category_id` must belong to the actor
  (`self.category_service.get_by_id(personal_category_id, actor)` — reuses
  the existing `CategoryService`, which already scopes lookups to the
  actor's own categories via `find_by_id`/`created_by` checks — if it errors
  or returns a category owned by someone else, translate to
  `Err(anyhow!("You can only map your own categories"))`).
  `tracked_category_id` must belong to this community
  (cross-community mapping attempts return
  `Err(anyhow!("This tracked category does not belong to this community"))`).
  Duplicate mapping (same tracked category + same personal category, already
  covered by the DB unique constraint) →
  `Err(anyhow!("You've already mapped this category"))`.
- **Delete mapping**: actor must own the mapping row
  (`mapping.user_id == actor.user_id`), else
  `Err(anyhow!("You can only remove your own category mappings"))`.
- **List mappings for member**: actor may only list their own mappings in
  v1 (`list_mappings_for_member(community_id, actor.user_id)` — there is no
  "view another member's mappings" endpoint; only the aggregated,
  privacy-respecting dashboard in Step 4 surfaces cross-member data).

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateTrackedCategoryDto {
    #[validate(length(min = 1, max = 60))]
    pub name: String,
    #[validate(length(min = 1))]
    pub color: String,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct UpdateTrackedCategoryDto {
    pub id: Uuid,
    #[validate(length(min = 1, max = 60))]
    pub name: Option<String>,
    pub color: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadTrackedCategoryDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub name: String,
    pub color: String,
    pub mapped_member_count: i64,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateCategoryMappingDto {
    pub tracked_category_id: Uuid,
    pub personal_category_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ReadCategoryMappingDto {
    pub id: Uuid,
    pub tracked_category: ReadTrackedCategoryDto,
    pub personal_category: ReadCategoryDto, // reused from dto::category::read_category
    pub created_at: DateTime<Local>,
}
```

`CommunityCategoryService` holds `CommunityCategoryRepository` + a
`CategoryService` reference (to validate personal-category ownership without
duplicating that logic):

- `pub async fn create_tracked_category(&self, community_id: Uuid, dto: CreateTrackedCategoryDto, actor: &Actor) -> Result<ReadTrackedCategoryDto>`
- `pub async fn update_tracked_category(&self, dto: UpdateTrackedCategoryDto, actor: &Actor) -> Result<ReadTrackedCategoryDto>`
- `pub async fn delete_tracked_category(&self, id: Uuid, actor: &Actor) -> Result<()>`
- `pub async fn list_tracked_categories(&self, community_id: Uuid, actor: &Actor) -> Result<Vec<ReadTrackedCategoryDto>>`
- `pub async fn create_mapping(&self, community_id: Uuid, dto: CreateCategoryMappingDto, actor: &Actor) -> Result<ReadCategoryMappingDto>`
- `pub async fn delete_mapping(&self, id: Uuid, actor: &Actor) -> Result<()>`
- `pub async fn list_my_mappings(&self, community_id: Uuid, actor: &Actor) -> Result<Vec<ReadCategoryMappingDto>>`

### DTOs (`backend/src/dto/...`)

- `backend/src/dto/community_category/create_tracked_category.rs` → `CreateTrackedCategoryDto`
- `backend/src/dto/community_category/update_tracked_category.rs` → `UpdateTrackedCategoryDto`
- `backend/src/dto/community_category/read_tracked_category.rs` → `ReadTrackedCategoryDto`
- `backend/src/dto/community_category/create_mapping.rs` → `CreateCategoryMappingDto`
- `backend/src/dto/community_category/read_mapping.rs` → `ReadCategoryMappingDto`
- `backend/src/dto/community_category/mod.rs` re-exports all of the above; add `pub mod community_category;` to `backend/src/dto/mod.rs`.

### Router (`backend/src/router/community/category.rs`, new file, merged into `community_router()`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/community/{community_id}/tracked-categories` | `create_tracked_category_handler` | required, owner only | Define a new tracked category |
| GET | `/api/community/{community_id}/tracked-categories` | `list_tracked_categories_handler` | required, member (or public) | List a community's tracked categories |
| PATCH | `/api/community/{community_id}/tracked-categories/{tracked_category_id}` | `update_tracked_category_handler` | required, owner only | Rename/recolor a tracked category |
| DELETE | `/api/community/{community_id}/tracked-categories/{tracked_category_id}` | `delete_tracked_category_handler` | required, owner only | Delete a tracked category (cascades mappings) |
| POST | `/api/community/{community_id}/category-mappings` | `create_mapping_handler` | required, member | Map one of the actor's own categories to a tracked category |
| GET | `/api/community/{community_id}/category-mappings/me` | `list_my_mappings_handler` | required, member | List the actor's own mappings in this community |
| DELETE | `/api/community/{community_id}/category-mappings/{mapping_id}` | `delete_mapping_handler` | required, owner of the mapping | Remove one of the actor's own mappings |

```rust
// backend/src/router/community/category.rs
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Router,
};
use tracing::instrument;
use uuid::Uuid;

use crate::{
    router::{clerk::Actor, request::ValidatedRequest, response::ApiResponse, root::AppState},
    service::community_category_service::{
        CreateCategoryMappingDto, CreateTrackedCategoryDto, ReadCategoryMappingDto,
        ReadTrackedCategoryDto, UpdateTrackedCategoryDto,
    },
};

pub fn category_mapping_routes() -> Router<AppState> {
    Router::new()
        .route(
            "/{community_id}/tracked-categories",
            post(create_tracked_category_handler).get(list_tracked_categories_handler),
        )
        .route(
            "/{community_id}/tracked-categories/{tracked_category_id}",
            axum::routing::patch(update_tracked_category_handler)
                .delete(delete_tracked_category_handler),
        )
        .route(
            "/{community_id}/category-mappings",
            post(create_mapping_handler),
        )
        .route(
            "/{community_id}/category-mappings/me",
            get(list_my_mappings_handler),
        )
        .route(
            "/{community_id}/category-mappings/{mapping_id}",
            axum::routing::delete(delete_mapping_handler),
        )
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, name = %payload.name))]
async fn create_tracked_category_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateTrackedCategoryDto>,
) -> ApiResponse<ReadTrackedCategoryDto> {
    let result = state
        .community_category_service
        .create_tracked_category(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn list_tracked_categories_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Vec<ReadTrackedCategoryDto>> {
    let result = state
        .community_category_service
        .list_tracked_categories(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id, tracked_category_id = %tracked_category_id))]
async fn update_tracked_category_handler(
    State(state): State<AppState>,
    Path((community_id, tracked_category_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
    ValidatedRequest(mut payload): ValidatedRequest<UpdateTrackedCategoryDto>,
) -> ApiResponse<ReadTrackedCategoryDto> {
    let _ = community_id; // scoping is enforced inside the service via ownership lookup
    payload.id = tracked_category_id;
    let result = state
        .community_category_service
        .update_tracked_category(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, tracked_category_id = %tracked_category_id))]
async fn delete_tracked_category_handler(
    State(state): State<AppState>,
    Path((community_id, tracked_category_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<()> {
    let _ = community_id;
    let result = state
        .community_category_service
        .delete_tracked_category(tracked_category_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn create_mapping_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateCategoryMappingDto>,
) -> ApiResponse<ReadCategoryMappingDto> {
    let result = state
        .community_category_service
        .create_mapping(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, community_id = %community_id))]
async fn list_my_mappings_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
) -> ApiResponse<Vec<ReadCategoryMappingDto>> {
    let result = state
        .community_category_service
        .list_my_mappings(community_id, &actor)
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(user_id = %actor, mapping_id = %mapping_id))]
async fn delete_mapping_handler(
    State(state): State<AppState>,
    Path((community_id, mapping_id)): Path<(Uuid, Uuid)>,
    actor: Actor,
) -> ApiResponse<()> {
    let _ = community_id;
    let result = state
        .community_category_service
        .delete_mapping(mapping_id, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

Wiring: `AppState` gains `community_category_service: CommunityCategoryService`,
constructed with `CommunityCategoryRepository::new(&db)` and a clone of
`category_service`. `community_router()` becomes
`Router::new().merge(crud_routes()).merge(membership_routes()).merge(category_mapping_routes())`.

## Frontend Implementation

### Types & Schemas

`next-frontend/api/definitions/models/community.ts` additions:

```ts
export const TrackedCategorySchema = z.object({
  id: z.uuid(),
  community_id: z.uuid(),
  name: z.string(),
  color: z.string(),
  mapped_member_count: z.number(),
});

export const CategoryMappingSchema = z.object({
  id: z.uuid(),
  tracked_category: TrackedCategorySchema,
  personal_category: CategoryWithIdSchema,
  created_at: z.coerce.date<Date>(),
});

export type TrackedCategory = z.infer<typeof TrackedCategorySchema>;
export type CategoryMapping = z.infer<typeof CategoryMappingSchema>;
```

`next-frontend/api/definitions/requests/community.ts` additions:

```ts
const createTrackedCategory = z.object({
  communityId: z.uuid(),
  name: z.string().trim().min(1, "Name is required").max(60),
  color: z.string().trim().min(1),
});
const updateTrackedCategory = z.object({
  communityId: z.uuid(),
  id: z.uuid(),
  name: z.string().trim().min(1).max(60).optional(),
  color: z.string().trim().min(1).optional(),
});
const deleteTrackedCategory = z.object({ communityId: z.uuid(), id: z.uuid() });
const listTrackedCategories = z.object({ communityId: z.uuid() });
const createMapping = z.object({
  communityId: z.uuid(),
  trackedCategoryId: z.uuid(),
  personalCategoryId: z.uuid(),
});
const deleteMapping = z.object({ communityId: z.uuid(), id: z.uuid() });
const listMyMappings = z.object({ communityId: z.uuid() });
```

`next-frontend/api/definitions/responses/community.ts` additions:

```ts
createTrackedCategory: TrackedCategorySchema,
listTrackedCategories: z.array(TrackedCategorySchema),
updateTrackedCategory: TrackedCategorySchema,
deleteTrackedCategory: z.null(),
createMapping: CategoryMappingSchema,
listMyMappings: z.array(CategoryMappingSchema),
deleteMapping: z.null(),
```

### API Client (`next-frontend/api/communityApi.ts` — additions)

```ts
export const listTrackedCategories = async (params: CommunityRequest["listTrackedCategories"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/tracked-categories`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listTrackedCategories);
};

export const createTrackedCategory = async (params: CommunityRequest["createTrackedCategory"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/tracked-categories`, {
    name: params.name,
    color: params.color,
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.createTrackedCategory);
};

export const updateTrackedCategory = async (params: CommunityRequest["updateTrackedCategory"]) => {
  const { data } = await baseApi.patch(
    `${BASE_URL}/${params.communityId}/tracked-categories/${params.id}`,
    { name: params.name, color: params.color },
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.updateTrackedCategory);
};

export const deleteTrackedCategory = async (params: CommunityRequest["deleteTrackedCategory"]) => {
  const { data } = await baseApi.delete(
    `${BASE_URL}/${params.communityId}/tracked-categories/${params.id}`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.deleteTrackedCategory);
};

export const createMapping = async (params: CommunityRequest["createMapping"]) => {
  const { data } = await baseApi.post(`${BASE_URL}/${params.communityId}/category-mappings`, {
    tracked_category_id: params.trackedCategoryId,
    personal_category_id: params.personalCategoryId,
  });
  return await parseResponseUnsafe(data, CommunityResponseSchema.createMapping);
};

export const listMyMappings = async (params: CommunityRequest["listMyMappings"]) => {
  const { data } = await baseApi.get(`${BASE_URL}/${params.communityId}/category-mappings/me`);
  return await parseResponseUnsafe(data, CommunityResponseSchema.listMyMappings);
};

export const deleteMapping = async (params: CommunityRequest["deleteMapping"]) => {
  const { data } = await baseApi.delete(
    `${BASE_URL}/${params.communityId}/category-mappings/${params.id}`,
  );
  return await parseResponseUnsafe(data, CommunityResponseSchema.deleteMapping);
};
```

### React Query Hooks (`next-frontend/components/hooks/community/...`)

`queryKeys.communities` additions:

```ts
trackedCategories: (communityId: string) => ({
  queryFn: async () => await CommunityApi.listTrackedCategories({ communityId }),
  queryKey: [communityId, "tracked-categories"],
}),
myMappings: (communityId: string) => ({
  queryFn: async () => await CommunityApi.listMyMappings({ communityId }),
  queryKey: [communityId, "my-mappings"],
}),
```

Hooks:
- `useTrackedCategories.ts` → `useTrackedCategories(communityId: string)`.
- `useCreateTrackedCategory.tsx` → mutation wrapping `CommunityApi.createTrackedCategory`; invalidates `queryKeys.communities.trackedCategories(communityId)._def` on success, toasts `"Tracked category created"`; error toast title `"Error creating tracked category"` (surfaces the duplicate-name message verbatim).
- `useUpdateTrackedCategory.tsx` → same invalidation, toast `"Tracked category updated"`.
- `useDeleteTrackedCategory.tsx` → invalidates tracked categories **and** `queryKeys.communities.myMappings(communityId)._def` (since deleting cascades mappings), toast `"Tracked category deleted"`.
- `useMyMappings.ts` → `useMyMappings(communityId: string)`.
- `useCreateMapping.tsx` → mutation wrapping `CommunityApi.createMapping`; **optimistic**: appends an optimistic `CategoryMapping` (looked up from already-cached `trackedCategories`/personal-categories data so the row renders with real name/color, `id: "optimistic"`) to `communities.myMappings(communityId)` in `onMutate`; rollback in `onError` with toast title `"Couldn't map category"`; invalidates on `onSettled`.
- `useDeleteMapping.tsx` → **optimistic**: removes the row from `communities.myMappings(communityId)` in `onMutate`; rollback + toast `"Couldn't remove mapping"` on error; invalidates on `onSettled`.

### UI Components

- `next-frontend/components/visualizers/communities/TrackedCategoryManager.tsx` — owner-only section on `CommunityDetailPage`: list of tracked categories as removable/editable chips (color dot + name), plus an inline "Add tracked category" form (name input + `ColorPicker`, reusing `components/visualizers/ColorPicker.tsx` exactly as `TagCreateForm` does).
- `next-frontend/components/visualizers/communities/TrackedCategoryChip.tsx` — single chip: color dot, name, edit-in-place on click (owner only), delete `X` with an `AlertDialog` confirming cascade ("This will remove N members' mappings to this category too").
- `next-frontend/components/visualizers/communities/CategoryMappingOnboarding.tsx` — full-screen-ish step shown to a member who has just joined and has zero mappings yet: for each tracked category, a `CategoryPicker` (multi-select reuse of `components/visualizers/categories/CategoryPicker.tsx`, same component `TagCreateForm` uses for allowed-categories) to pick which of the member's personal categories map to it. A "Skip for now" link is always available — mapping is not a hard gate to viewing the community.
- `next-frontend/components/visualizers/communities/MyMappingsList.tsx` — ongoing management view (reachable any time from the community detail page, not just on first join): rows of `personal category → tracked category`, each removable; a "+ Add mapping" button opens a small inline form (tracked-category `Select` + `CategoryPicker` single-select).
- `CommunityDetailPage.tsx` (extended again) — gains a "Tracked Categories" section (owner sees `TrackedCategoryManager`, members see a read-only chip list) and a "My Mappings" section rendering `MyMappingsList`; if the member has zero mappings and at least one tracked category exists, renders `CategoryMappingOnboarding` instead of the empty `MyMappingsList`.

**User journey — owner sets up tracked categories:**

1. Owner opens their community's detail page, scrolls to "Tracked Categories," currently empty.
2. Owner clicks "Add tracked category," types "Algorithms," picks a color from `ColorPicker`, clicks the check/save icon.
3. The chip appears immediately (post-success, non-optimistic — creation needs the server id); owner repeats for "Databases," "Operating Systems."
4. Owner is done; members can now map into these three buckets.

**User journey — new member maps their categories:**

1. A member who just joined (from Step 2's flow) opens the community detail page for the first time and sees `CategoryMappingOnboarding` instead of an empty mappings list, because tracked categories exist and they have zero mappings.
2. For "Algorithms," they open the `CategoryPicker` and see their own personal categories ("CS101 grind", "Leetcode", "Uni"). They select "CS101 grind" and "Leetcode."
3. Each selection fires `useCreateMapping` immediately (no separate "save" step — matches `CategoryPicker`'s existing multi-select-fires-immediately UX used elsewhere) and the chip appears under "Algorithms" instantly (optimistic).
4. They repeat for "Databases" (mapping "Uni") and leave "Operating Systems" unmapped for now — nothing forces completeness.
5. They click "Done" (or navigate away); `MyMappingsList` now shows their 3 mappings on future visits, with the option to add more or remove any, and `CategoryMappingOnboarding` never appears again since mappings are no longer zero.

## UX & Polish

- **Loading state**: `TrackedCategoryManager`/read-only chip list shows 3 skeleton pill shapes while `useTrackedCategories` loads. `MyMappingsList`/`CategoryMappingOnboarding` shows a skeleton block per tracked category (matching the eventual real layout) while `useTrackedCategories` and `useMyMappings` are both loading.
- **Empty state**:
  - No tracked categories yet (member view): centered copy **"This community hasn't set up tracked categories yet"**, body **"Once the owner adds some, you'll be able to connect your own categories to them."** — no action available to a non-owner.
  - No tracked categories yet (owner view): the `TrackedCategoryManager`'s add-form is simply always visible with placeholder copy **"Add your first tracked category, e.g. \"Algorithms\" or \"Weekly Standup\""** in the name input.
  - Member has mappings available but chose to skip: `MyMappingsList` shows **"You haven't connected any of your categories yet"** with a "Map categories" button that opens the same picker flow as onboarding.
- **Error states**:
  - Duplicate tracked category name → toast title `"Error creating tracked category"`, body: the server's exact message, `"This community already tracks a category named \"Algorithms\""`.
  - Mapping someone else's category (should be unreachable via UI since `CategoryPicker` only lists the actor's own categories, but defensive) → toast `"Couldn't map category"`, body `"You can only map your own categories"`.
  - Duplicate mapping attempt → toast `"Couldn't map category"`, body `"You've already mapped this category"`.
  - Delete tracked category when members have mappings → the `AlertDialog` shown *before* the request states the cascade count using `mapped_member_count`; on failure (rare — network error) toast `"Couldn't delete tracked category"`.
  - Inline validation: tracked category name empty → `"Name is required"`; name > 60 chars → `"Name must be 60 characters or fewer"`.
- **Optimistic update**: Creating and deleting a *mapping* are the instant-feeling actions here (a member picking categories in a live picker expects immediate feedback), implemented exactly as described in the Hooks section. Tracked-category create/update/delete are owner-configuration actions, less frequent and less latency-sensitive, so they follow the non-optimistic "await + toast + refetch" pattern used for community create/update in Step 1.
- **Responsive**: `CategoryMappingOnboarding` stacks one tracked-category block per row full-width below `sm` (already effectively single-column; explicitly avoid a multi-column layout at any width that would make picker dropdowns cramped). `TrackedCategoryManager`'s chip list wraps (`flex flex-wrap`) at all widths. `MyMappingsList` rows go from a single horizontal line (personal category → tracked category → remove button) at `sm`+ to a two-line stacked card below `sm`.
- **Accessibility**: `CategoryPicker` (reused component) already supports keyboard selection; verify the tracked-category `Select` in `MyMappingsList`'s add-mapping form is a real `<select>`-backed shadcn `Select` reachable via Tab/Arrow keys. Tracked-category chips' delete `X` button has `aria-label="Remove {name} tracked category"` (not just an icon). The mapping arrow (personal → tracked) is rendered with an `ArrowRight` icon *and* is wrapped in a sentence read naturally by screen readers (e.g. `aria-label="CS101 grind maps to Algorithms"` on the row), not conveyed by layout position alone. Color dots on chips are always paired with the category name as text, never color-only.

## Acceptance Criteria

- [ ] Migration `0059_create_community_tracked_categories.sql` applies cleanly on top of `0058`.
- [ ] Only the community owner can create/update/delete tracked categories; a member attempt returns an error and makes no change.
- [ ] Creating a tracked category with a name that already exists in that community fails with a descriptive error; the same name is allowed in a *different* community.
- [ ] Any member can list tracked categories for a community they belong to.
- [ ] A member can map one of their own personal categories to a tracked category; the same personal category can be mapped to more than one tracked category.
- [ ] A member cannot map another user's personal category (attempt fails).
- [ ] A member cannot map to a tracked category belonging to a different community (attempt fails).
- [ ] A member can only delete their own mappings, never another member's (attempt on someone else's mapping id fails).
- [ ] Deleting a tracked category removes all mappings to it (cascade verified) without deleting anyone's personal category.
- [ ] Frontend: a new member with zero mappings and at least one tracked category sees the onboarding picker instead of an empty list.
- [ ] Frontend: selecting a category in the onboarding picker reflects instantly (optimistic) and persists after refetch.

## Testing Notes

- Backend:
  - `create_tracked_category_by_non_owner_is_rejected`.
  - `create_tracked_category_duplicate_name_in_same_community_fails`.
  - `create_tracked_category_same_name_in_different_community_succeeds`.
  - `delete_tracked_category_cascades_mappings` — create a mapping, delete the tracked category, assert the mapping row is gone and the personal `category` row still exists.
  - `create_mapping_with_another_users_category_fails`.
  - `create_mapping_with_tracked_category_from_different_community_fails`.
  - `create_duplicate_mapping_fails` (same tracked + personal category twice).
  - `delete_mapping_by_non_owner_of_mapping_fails`.
  - `list_my_mappings_only_returns_actors_own_mappings` — seed two members' mappings, assert each actor only sees their own.
  - `one_personal_category_can_map_to_multiple_tracked_categories`.
- Frontend (Storybook):
  - `TrackedCategoryManager.stories.tsx` — empty (owner, first-run copy in the add input), populated with chips, edit-in-place open, delete-confirmation open.
  - `CategoryMappingOnboarding.stories.tsx` — no tracked categories message, tracked categories present with zero personal categories to offer (edge case: prompt to create a category first, linking to `/home/category`), tracked categories present with selections made (optimistic chips visible).
  - `MyMappingsList.stories.tsx` — empty state, populated, add-mapping form open, mobile stacked layout.
  - `TrackedCategoryChip.stories.tsx` — default, owner-editable, member-readonly, delete-confirmation with non-zero `mapped_member_count` warning text.
