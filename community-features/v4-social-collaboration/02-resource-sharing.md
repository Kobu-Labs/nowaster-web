# Step 2: Resource Sharing

## Overview

Members share links and reference material relevant to the community or one
of its tracked categories — a syllabus PDF link, a useful tutorial, a shared
drive folder. This is a lightweight link-and-metadata registry, not a file
host: Nowaster has no existing upload/storage-for-user-content path outside
the `s3_client` used for DB backups (`backend/src/repository/db_backup.rs`),
and standing up general file upload is out of scope for a v4 slice. Depends
on `community_member` (v1/v2) for authorship/permission checks and
`community_tracked_category` (v1) for optional category scoping.

## Scope

- In scope:
  - Submit a resource: title, URL, optional description, optional
    tracked-category scope, resource type (`link` or `document` — both are
    just URLs; `document` is a UI hint that it's a file link like a Google
    Doc/PDF rather than an article, no different handling server-side).
  - URL validation: must be `http://` or `https://`, max 2048 chars.
  - Pin a resource (surfaces at the top) — manager/owner only.
  - Remove a resource — manager/owner (any resource) or the submitter (own
    resource).
  - List resources for a community, filterable by tracked category, sorted
    pinned-first then newest.
  - Basic link-preview metadata: **not** fetched server-side (no existing
    URL-preview/OpenGraph-scraping infra in the backend, and fetching
    arbitrary user-submitted URLs server-side is an SSRF surface not worth
    opening for a v4 slice) — the submitter supplies the title/description
    manually.
- Explicitly deferred / out of scope:
  - File upload/hosting (→ would need a general-purpose S3 upload path,
    doesn't exist yet, out of scope).
  - Server-side link-preview/OpenGraph scraping (SSRF risk, no infra — see
    above).
  - Voting/ranking resources by usefulness (no reaction primitive scoped to
    communities yet, same reasoning as forum step).
  - Resource comments/discussion (use the forum for that — a resource can
    be referenced from a forum post by pasting its link, no formal linking
    feature between the two).
  - Automatic dead-link checking (would need a background crawler; out of
    scope, flag via manual moderation report if needed later).

## Data Model

Migration filename: `backend/migrations/0079_create_community_resource_table.sql`

```sql
CREATE TYPE community_resource_type AS ENUM (
    'link',
    'document'
);

CREATE TABLE community_resource (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    tracked_category_id UUID NULL REFERENCES community_tracked_category(id) ON DELETE SET NULL,
    submitted_by_member_id UUID NOT NULL REFERENCES community_member(id) ON DELETE CASCADE,

    resource_type community_resource_type NOT NULL DEFAULT 'link',
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
    url TEXT NOT NULL CHECK (char_length(url) <= 2048 AND (url LIKE 'http://%' OR url LIKE 'https://%')),
    description TEXT NULL CHECK (description IS NULL OR char_length(description) <= 500),

    pinned BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX idx_community_resource_listing
    ON community_resource(community_id, pinned DESC, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_community_resource_tracked_category
    ON community_resource(tracked_category_id)
    WHERE deleted_at IS NULL;
```

No dedicated notification type — a new resource is visible via the activity
feed (`community_activity_event`, `event_type = 'resource_shared'`); it
doesn't warrant interrupting anyone the way a direct reply does.

### Rust entity (`backend/src/entity/community_resource.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_resource_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum ResourceType {
    Link,
    Document,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityResource {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Option<Uuid>,
    pub submitted_by_member_id: Uuid,
    pub resource_type: ResourceType,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub pinned: bool,
    pub created_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_resource.rs`)

```rust
pub struct CommunityResourceRepository { db: Arc<Database> }

impl CommunityResourceRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn create(&self, community_id: Uuid, submitted_by_member_id: Uuid, dto: CreateResourceDto) -> Result<ResourceWithSubmitterDto>;
    pub async fn get(&self, resource_id: Uuid) -> Result<Option<ResourceWithSubmitterDto>>;
    pub async fn list(&self, community_id: Uuid, tracked_category_id: Option<Uuid>, page: i64, page_size: i64) -> Result<Vec<ResourceWithSubmitterDto>>;
    pub async fn set_pinned(&self, resource_id: Uuid, pinned: bool) -> Result<ResourceWithSubmitterDto>;
    pub async fn soft_delete(&self, resource_id: Uuid) -> Result<()>;
}
```

### Service (`backend/src/service/community_resource_service.rs`)

- **Submit**: actor must be a member of `community_id`. If
  `tracked_category_id` set, validate it belongs to the same community
  (same check pattern as forum threads). Validate `url` starts with
  `http://`/`https://` at the service layer too (defense in depth beyond
  the DB `CHECK` and the Zod schema) — return "Please provide a valid
  http(s) URL" otherwise.
- **Pin**: manager/owner only — "Only managers and owners can pin
  resources".
- **Delete**: manager/owner (any resource), or
  `actor_member_id == resource.submitted_by_member_id` (own resource, no
  time limit — unlike forum threads, a bad link is worth being able to
  retract any time).
- On successful submit: insert `community_activity_event` with
  `event_type = 'resource_shared'`, `data = { resource_id, title,
  tracked_category_id }`.

### DTOs

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateResourceDto {
    pub resource_type: ResourceType,
    #[validate(length(min = 1, max = 150))]
    pub title: String,
    #[validate(url, length(max = 2048))]
    pub url: String,
    #[validate(length(max = 500))]
    pub description: Option<String>,
    pub tracked_category_id: Option<Uuid>,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct SetResourcePinnedDto {
    pub resource_id: Uuid,
    pub pinned: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ResourceWithSubmitterDto {
    pub id: Uuid,
    pub community_id: Uuid,
    pub tracked_category_id: Option<Uuid>,
    pub submitted_by: ReadUserDto,
    pub resource_type: ResourceType,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub pinned: bool,
    pub created_at: DateTime<Local>,
}
```

### Router (`backend/src/router/community/resource.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/:id/resources` | `list_resources_handler` | member | List, optional `?tracked_category_id=` |
| POST | `/api/community/:id/resources` | `create_resource_handler` | member | Submit a resource |
| PATCH | `/api/community/:id/resources/:resource_id/pin` | `set_resource_pinned_handler` | manager/owner | Pin/unpin |
| DELETE | `/api/community/:id/resources/:resource_id` | `delete_resource_handler` | submitter or manager/owner | Remove |

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, community_id = %community_id))]
async fn create_resource_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateResourceDto>,
) -> ApiResponse<ResourceWithSubmitterDto> {
    let result = state
        .community_resource_service
        .create_resource(community_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/communityResource.ts`)

```ts
export const ResourceTypeSchema = z.enum(["link", "document"]);

export const CommunityResourceSchema = z.object({
  id: z.string().uuid(),
  community_id: z.string().uuid(),
  tracked_category_id: z.string().uuid().nullable(),
  submitted_by: ReadUserSchema,
  resource_type: ResourceTypeSchema,
  title: z.string().trim().min(1).max(150),
  url: z.string().url(),
  description: z.string().max(500).nullable(),
  pinned: z.boolean(),
  created_at: z.coerce.date<Date>(),
});
export type CommunityResource = z.infer<typeof CommunityResourceSchema>;

const create = z.object({
  resource_type: ResourceTypeSchema,
  title: z.string().trim().min(1, "Give it a title").max(150),
  url: z.string().trim().url("Enter a valid http(s) link"),
  description: z.string().trim().max(500).optional(),
  tracked_category_id: z.string().uuid().optional(),
});
const setPinned = z.object({ resource_id: z.string().uuid(), pinned: z.boolean() });

export const CommunityResourceRequestSchema = { create, setPinned };
export type CommunityResourceRequest = {
  [K in keyof typeof CommunityResourceRequestSchema]: z.infer<(typeof CommunityResourceRequestSchema)[K]>;
};
```

### API Client (`next-frontend/api/communityResourceApi.ts`)

```ts
export const listResources = async (communityId: string, params?: { tracked_category_id?: string; page?: number }) => { ... };
export const createResource = async (communityId: string, params: CommunityResourceRequest["create"]) => { ... };
export const setResourcePinned = async (communityId: string, params: CommunityResourceRequest["setPinned"]) => { ... };
export const deleteResource = async (communityId: string, resourceId: string) => { ... };
```

### React Query Hooks (`next-frontend/components/hooks/communityResource/`)

- `useCommunityResources(communityId, filters)` — `useQuery`, `queryKeys.communities.resources(communityId, filters)`.
- `useCreateCommunityResource(communityId)` — `useMutation`, invalidates `resources(communityId)` on success, toast "Resource shared".
- `useSetResourcePinned(communityId)` — `useMutation` with optimistic pin toggle.
- `useDeleteCommunityResource(communityId)` — `useMutation` with optimistic removal from the list, rollback on error.

`queryKeys.communities` additions:

```ts
resources: (communityId: string, filters?: { trackedCategoryId?: string }) => ({
  queryKey: [communityId, "resources", filters ?? {}],
  queryFn: async () => await CommunityResourceApi.listResources(communityId, { tracked_category_id: filters?.trackedCategoryId }),
}),
```

### UI Components (`next-frontend/components/community/resources/`)

- `ResourceList.tsx` — grid/list of `ResourceCard`, pinned resources shown first with a subtle divider.
- `ResourceCard.tsx` — title (linked, opens in new tab with `rel="noopener noreferrer"`), domain (parsed from URL, e.g. "docs.google.com"), description, submitter avatar + name, pin/delete affordances gated by role/ownership.
- `NewResourceDialog.tsx` — form: type toggle (link/document), title, URL, description, tracked-category select.
- `ResourceCategoryFilter.tsx` — same chip-filter pattern as the forum's category filter, reused for consistency.
- `ResourceTypeIcon.tsx` — link icon vs. document icon, purely visual, paired with a text label for the type in the card (not icon-only).

Primary user journey — submitting a resource:

1. Member opens **Resources** tab → `ResourceList` loads (skeleton cards while `useCommunityResources` is pending).
2. Member clicks **Share a resource** → `NewResourceDialog` opens, focus moves to the title field.
3. Member fills title/URL, optionally description and tracked category, submits.
4. Inline Zod validation catches an invalid URL before submit; if the server rejects the tracked category, an error toast surfaces the server message and the dialog stays open with the entered data intact.
5. On success: dialog closes, toast "Resource shared", `ResourceList` refetches and the new card appears at the top of its (non-pinned) section.

## UX & Polish

- **Loading state**: `ResourceList` renders 4 skeleton cards (title bar + two text lines + avatar chip).
- **Empty state**: icon (bookmark/link), heading "No resources shared yet", body "Links, docs, and references the community finds useful will show up here." primary button **Share a resource**.
- **Error states** (toast copy):
  - Invalid URL slipping past client validation (server 400-equivalent): title "Couldn't share that link", description "That doesn't look like a valid web address — check it starts with http:// or https://."
  - Submit fails for a category-mismatch reason: title "Couldn't share that link", description server message ("This category does not belong to this community").
  - Delete fails (permission race): title "Couldn't remove resource", description "You may no longer have permission to remove this — refresh and try again."
- **Optimistic updates**: pin/unpin and delete both apply instantly with rollback on failure; new-resource submission is not optimistic (needs the dialog to stay open on error with the user's typed content preserved, which is simpler as a plain awaited mutation).
- **Responsive (mobile)**: `ResourceList` switches from a 2–3 column card grid to a single column; `ResourceCard` truncates description to 2 lines with a "more" toggle rather than growing the card; the category filter chip row scrolls horizontally.
- **Accessibility**: resource links use visible focus rings and `aria-label` combining title + "opens in new tab"; the pin toggle is a real button with `aria-pressed`; `NewResourceDialog` follows the same focus-trap/return-focus pattern as `NewForumThreadDialog`; resource type is conveyed with icon + text, not icon alone.

## Acceptance Criteria

- [ ] A member can submit a resource with a valid http(s) URL; invalid URLs are rejected both client-side (Zod) and server-side.
- [ ] A resource can optionally be scoped to one of the community's tracked categories; scoping to another community's category is rejected.
- [ ] Only manager/owner can pin/unpin a resource.
- [ ] A resource's submitter can delete their own resource at any time; manager/owner can delete any resource; other members cannot delete anyone's resource including their own if role checks are somehow bypassed client-side (server-enforced).
- [ ] Pinned resources sort before non-pinned ones, newest first within each group.
- [ ] Submitting a resource inserts a `community_activity_event` with `event_type = 'resource_shared'`.
- [ ] Deleting a resource soft-deletes it (excluded from listings, row retained).

## Testing Notes

- Backend (`cargo test`, `community_resource_service` tests):
  - `member_can_submit_link_resource` / `member_can_submit_document_resource`.
  - `submit_rejects_non_http_url` — asserts `Err` for a `ftp://` or bare-string URL.
  - `submit_rejects_tracked_category_from_other_community`.
  - `only_manager_or_owner_can_pin_resource` — table-test over roles.
  - `submitter_can_delete_own_resource`, `non_submitter_non_manager_cannot_delete_resource` — asserts `Err`.
  - `submit_resource_emits_activity_event` — asserts a `community_activity_event` row with `event_type = 'resource_shared'` exists after submission.
- Frontend (Storybook stories under `next-frontend/stories/community/resources/`):
  - `ResourceList.stories.tsx` — Default, Empty, Loading, WithPinnedResource.
  - `ResourceCard.tsx` — LinkType, DocumentType, LongDescriptionTruncated, OwnerControls, ManagerControls, ReadOnly.
  - `NewResourceDialog.stories.tsx` — Default, InvalidUrlError, ServerErrorOnSubmit.
