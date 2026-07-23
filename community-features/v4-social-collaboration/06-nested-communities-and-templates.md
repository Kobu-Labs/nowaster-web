# Step 6: Nested Communities and Templates

## Overview

Two structural features that make communities reusable at organizational
scale: **nesting** (sub-communities under a parent, e.g. departments under
a faculty) and **templates** (package a community's tracked-category
structure and settings for reuse, e.g. "Computer Science Department
template" that every new course community starts from). Depends on
`community` (v1, gets a new nullable self-referencing column) and
`community_tracked_category` (v1, what a template snapshots).

## Scope

- In scope:
  - Add `parent_community_id` to `community` (nullable, self-referencing).
  - Create a sub-community under a parent — requires manager/owner role in
    the *parent*.
  - Max nesting depth of **2** (top-level community → one level of
    sub-communities, no sub-sub-communities) — a concrete, simple limit
    that covers the stated use case (departments within a faculty) without
    open-ended recursive complexity.
  - Breadcrumb navigation showing parent → current community.
  - A sub-community is otherwise a fully independent community: its own
    membership, tracked categories, forums, etc. — joining a parent does
    **not** auto-join its sub-communities and vice versa (explicit
    membership per community, no cascading membership).
  - Parent-level rollup: parent community dashboard shows an *aggregate*
    total across itself + all direct sub-communities (sum of each
    sub-community's own aggregate, not a re-computation from raw sessions,
    keeping the query bounded by "number of sub-communities" rather than
    "number of sessions across the whole tree").
  - Save a community's current structure (tracked categories + name/avatar
    pattern + visibility settings) as a template — manager/owner only.
  - Browse templates: the creator's own saved templates, plus templates
    marked `is_public` by any community's owner.
  - Create a new community from a template: pre-fills tracked categories
    and default settings; the creating user still supplies a name,
    description, and (if applicable) parent community — a template is a
    starting point, not a live link (editing the template later doesn't
    retroactively change communities already created from it).
- Explicitly deferred / out of scope:
  - Deeper nesting than 2 levels — deferred as a concrete, simple v4 limit;
    revisit only if real usage demands it.
  - Moving an existing community to a different parent, or promoting a
    sub-community to top-level — not exposed in v4 (would need
    cycle-detection and re-parenting logic disproportionate to the
    slice; a community's parent is set once at creation).
  - Cross-community leaderboards/rankings comparing sibling sub-communities
    against each other (the parent rollup is a sum, not a comparison view;
    a "which department is most active" leaderboard is a plausible
    post-v4 feature).
  - Template versioning/history — a template is a single static snapshot;
    re-saving overwrites the previous snapshot rather than creating a
    version history.
  - Reusing `session_template`/`SessionTemplate`
    (`backend/src/entity/session_template.rs`) in any way: that concept is
    a **personal recurring-session scheduler** (a user's own template
    defines `RecurringSession`s on an interval like weekly/monthly, tied
    to `session.template_id` per `backend/migrations/0019_template-column-on-session.sql`)
    — structurally unrelated to a community-structure template. The only
    thing they share is the English word "template"; no code, table, or
    pattern is reused between them.

## Data Model

Migration filename: `backend/migrations/0087_add_parent_community_id_to_community.sql`

```sql
ALTER TABLE community
ADD COLUMN parent_community_id UUID NULL REFERENCES community(id) ON DELETE SET NULL;

-- A community cannot be its own parent.
ALTER TABLE community
ADD CONSTRAINT chk_community_not_own_parent CHECK (parent_community_id IS DISTINCT FROM id);

CREATE INDEX idx_community_parent ON community(parent_community_id) WHERE parent_community_id IS NOT NULL;
```

Depth (max 2 levels) is **not** enforced by a recursive DB constraint
(Postgres `CHECK` constraints can't reference other rows) — it's enforced
in the service layer at sub-community creation time by checking that the
chosen parent's own `parent_community_id IS NULL` before allowing the
insert. This is the same "correctness enforced where it's actually
checkable" stance the codebase already takes (e.g. friend-request duplicate
checks live in the repository/service, not a DB constraint, in
`friends.rs`).

Migration filename: `backend/migrations/0088_create_community_template_table.sql`

```sql
CREATE TABLE community_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_community_id UUID NULL REFERENCES community(id) ON DELETE SET NULL,
    created_by TEXT NOT NULL REFERENCES "user"(id),

    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 150),
    description TEXT NULL CHECK (description IS NULL OR char_length(description) <= 1000),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    -- Snapshot, not a live reference: tracked categories (name + color) and
    -- default settings, structured as JSONB so the shape can evolve without
    -- a migration per field. Validated by the service/DTO layer on write.
    structure JSONB NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_community_template_public ON community_template(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_community_template_creator ON community_template(created_by);
```

Example `structure` JSONB shape (documented here since it's not enforced by
SQL column types):

```json
{
  "visibility_type": "invite_only",
  "data_visibility": "members_only",
  "tracked_categories": [
    { "name": "Algorithms", "color": "#4f46e5" },
    { "name": "Databases", "color": "#059669" }
  ]
}
```

### Rust entities (`backend/src/entity/community_template.rs`)

```rust
use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct TemplateTrackedCategory {
    pub name: String,
    pub color: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityTemplateStructure {
    pub visibility_type: String, // mirrors community.visibility_type enum values as strings inside JSONB
    pub data_visibility: String,
    pub tracked_categories: Vec<TemplateTrackedCategory>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct CommunityTemplate {
    pub id: Uuid,
    pub source_community_id: Option<Uuid>,
    pub created_by: String,
    pub name: String,
    pub description: Option<String>,
    pub is_public: bool,
    pub structure: CommunityTemplateStructure,
    pub created_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community_nesting.rs`, `backend/src/repository/community_template.rs`)

```rust
pub struct CommunityNestingRepository { db: Arc<Database> }

impl CommunityNestingRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn get_parent_depth_marker(&self, community_id: Uuid) -> Result<Option<Uuid>>; // returns the community's own parent_community_id, if any
    pub async fn create_sub_community(&self, parent_id: Uuid, dto: CreateCommunityDto) -> Result<Community>; // delegates most fields to the existing v1 community-create query, just also sets parent_community_id
    pub async fn list_sub_communities(&self, parent_id: Uuid) -> Result<Vec<Community>>;
    pub async fn get_breadcrumb(&self, community_id: Uuid) -> Result<Vec<Community>>; // [parent, self] or [self] if top-level
    pub async fn get_parent_rollup_totals(&self, parent_id: Uuid) -> Result<ParentRollupDto>; // sums each sub-community's own aggregate total
}

pub struct CommunityTemplateRepository { db: Arc<Database> }

impl CommunityTemplateRepository {
    pub fn new(db_conn: &Arc<Database>) -> Self;

    pub async fn create(&self, created_by: String, dto: CreateTemplateDto) -> Result<CommunityTemplate>;
    pub async fn get(&self, template_id: Uuid) -> Result<Option<CommunityTemplate>>;
    pub async fn list_own(&self, user_id: &str) -> Result<Vec<CommunityTemplate>>;
    pub async fn list_public(&self) -> Result<Vec<CommunityTemplate>>;
    pub async fn update_structure(&self, template_id: Uuid, structure: CommunityTemplateStructure) -> Result<CommunityTemplate>;
    pub async fn delete(&self, template_id: Uuid) -> Result<()>;
}
```

### Service (`backend/src/service/community_nesting_service.rs`)

- **Create sub-community**: actor must be `manager`/`owner` in the parent
  community. Depth check: fetch the parent's own `parent_community_id` —
  if it's `Some(_)`, reject with "Sub-communities can't have their own
  sub-communities (max nesting depth is 2)." Otherwise delegates to the
  existing v1 community-create flow with `parent_community_id` set. The
  actor creating the sub-community automatically becomes its `owner`
  (same as top-level community creation — nesting doesn't change who owns
  what, a parent manager isn't automatically an owner of every
  sub-community they spin up beyond the one they personally create).
- **List sub-communities**: visible to anyone who can view the parent
  (respects the parent's `visibility_type`, same rule v1 uses for the
  parent itself — nesting doesn't introduce a new visibility axis).
- **Parent rollup**: sums `total_minutes` from each sub-community's
  existing v1 aggregate query result (calls the v1 aggregation
  service/repository once per sub-community, not a raw cross-community
  session join) — bounded by sub-community count, which is expected to be
  small (tens, not thousands) for the "departments in a faculty" use case.
  Available to anyone who can view the parent's dashboard.

### Service (`backend/src/service/community_template_service.rs`)

- **Save as template**: actor must be `manager`/`owner` of
  `source_community_id`. Snapshots the community's current
  `visibility_type`, `data_visibility`, and all non-archived
  `community_tracked_category` rows (name + color) into the `structure`
  JSONB. `is_public` defaults `false` (only the creating manager/owner and
  other managers/owners of the *same* community can see it initially,
  toggle explicitly to share it org-wide via `is_public`).
- **Update/re-save**: only the original `created_by` user can overwrite an
  existing template's `structure` (no template-level roles — templates are
  owned by the user who saved them, not the community, since a manager may
  save a personal template independent of continued access to that
  community).
- **Delete**: only `created_by`.
- **Create community from template**: any authenticated user for a
  `is_public = true` template, or the `created_by` user for a private one.
  Takes the template's `structure`, creates a new `community` row with the
  template's `visibility_type`/`data_visibility` as defaults (caller can
  override before submitting — the frontend pre-fills a normal
  create-community form rather than silently creating on click), and bulk
  -inserts a `community_tracked_category` row per entry in
  `structure.tracked_categories`. This reuses the v1 community-create and
  tracked-category-create repository functions internally rather than
  duplicating insert logic — the template service is a thin orchestration
  layer over v1's existing primitives plus its own `community_template`
  table.

### DTOs

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateSubCommunityDto {
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility_type: CommunityVisibilityType,
    pub data_visibility: CommunityDataVisibility,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct BreadcrumbEntryDto {
    pub id: Uuid,
    pub name: String,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct ParentRollupDto {
    pub parent_total_minutes: i64,
    pub sub_community_totals: Vec<SubCommunityTotalDto>,
    pub combined_total_minutes: i64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct SubCommunityTotalDto {
    pub community_id: Uuid,
    pub name: String,
    pub total_minutes: i64,
    pub member_count: i32,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateTemplateDto {
    pub source_community_id: Uuid,
    #[validate(length(min = 1, max = 150))]
    pub name: String,
    #[validate(length(max = 1000))]
    pub description: Option<String>,
    pub is_public: bool,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CreateCommunityFromTemplateDto {
    pub template_id: Uuid,
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    pub description: Option<String>,
    pub parent_community_id: Option<Uuid>,
    // Overrides applied on top of the template's defaults; None = use template value.
    pub visibility_type: Option<CommunityVisibilityType>,
    pub data_visibility: Option<CommunityDataVisibility>,
}
```

### Router (`backend/src/router/community/nesting.rs`, `backend/src/router/community/template.rs`)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/community/:id/sub-communities` | `create_sub_community_handler` | manager/owner of `:id` | Create a sub-community |
| GET | `/api/community/:id/sub-communities` | `list_sub_communities_handler` | anyone who can view `:id` | List direct sub-communities |
| GET | `/api/community/:id/breadcrumb` | `get_breadcrumb_handler` | anyone who can view `:id` | `[parent?, self]` |
| GET | `/api/community/:id/rollup` | `get_parent_rollup_handler` | anyone who can view `:id` | Aggregate incl. sub-communities |
| POST | `/api/community/templates` | `create_template_handler` | manager/owner of `source_community_id` | Save a community as a template |
| GET | `/api/community/templates?scope=mine\|public` | `list_templates_handler` | authenticated | Browse templates |
| PATCH | `/api/community/templates/:template_id` | `update_template_handler` | `created_by` | Re-save structure / toggle `is_public` |
| DELETE | `/api/community/templates/:template_id` | `delete_template_handler` | `created_by` | Delete a template |
| POST | `/api/community/from-template` | `create_from_template_handler` | authenticated (public template) or `created_by` (private) | Create a community from a template |

```rust
#[instrument(err, skip(state), fields(actor_id = %actor, parent_community_id = %parent_id))]
async fn create_sub_community_handler(
    State(state): State<AppState>,
    Path(parent_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<CreateSubCommunityDto>,
) -> ApiResponse<Community> {
    let result = state
        .community_nesting_service
        .create_sub_community(parent_id, payload, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas (`next-frontend/api/definitions/{models,requests,responses}/{communityNesting,communityTemplate}.ts`)

```ts
export const BreadcrumbEntrySchema = z.object({ id: z.string().uuid(), name: z.string() });

export const ParentRollupSchema = z.object({
  parent_total_minutes: z.number().int(),
  sub_community_totals: z.array(
    z.object({
      community_id: z.string().uuid(),
      name: z.string(),
      total_minutes: z.number().int(),
      member_count: z.number().int(),
    }),
  ),
  combined_total_minutes: z.number().int(),
});

export const CommunityTemplateStructureSchema = z.object({
  visibility_type: z.enum(["public", "invite_only"]),
  data_visibility: z.enum(["public", "members_only"]),
  tracked_categories: z.array(z.object({ name: z.string(), color: z.string() })),
});

export const CommunityTemplateSchema = z.object({
  id: z.string().uuid(),
  source_community_id: z.string().uuid().nullable(),
  created_by: z.string(),
  name: z.string().min(1).max(150),
  description: z.string().max(1000).nullable(),
  is_public: z.boolean(),
  structure: CommunityTemplateStructureSchema,
  created_at: z.coerce.date<Date>(),
});
export type CommunityTemplate = z.infer<typeof CommunityTemplateSchema>;

const createSubCommunity = z.object({
  name: z.string().trim().min(1, "Name it").max(100),
  description: z.string().trim().optional(),
  avatar_url: z.string().url().optional(),
  visibility_type: z.enum(["public", "invite_only"]),
  data_visibility: z.enum(["public", "members_only"]),
});

const createTemplate = z.object({
  source_community_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name your template").max(150),
  description: z.string().trim().max(1000).optional(),
  is_public: z.boolean().default(false),
});

const createFromTemplate = z.object({
  template_id: z.string().uuid(),
  name: z.string().trim().min(1, "Name it").max(100),
  description: z.string().trim().optional(),
  parent_community_id: z.string().uuid().optional(),
  visibility_type: z.enum(["public", "invite_only"]).optional(),
  data_visibility: z.enum(["public", "members_only"]).optional(),
});

export const CommunityNestingRequestSchema = { createSubCommunity };
export const CommunityTemplateRequestSchema = { createTemplate, createFromTemplate };
```

### API Client (`next-frontend/api/{communityNestingApi,communityTemplateApi}.ts`)

```ts
export const createSubCommunity = async (parentId: string, params: CommunityNestingRequest["createSubCommunity"]) => { ... };
export const listSubCommunities = async (parentId: string) => { ... };
export const getBreadcrumb = async (communityId: string) => { ... };
export const getParentRollup = async (parentId: string) => { ... };

export const createTemplate = async (params: CommunityTemplateRequest["createTemplate"]) => { ... };
export const listTemplates = async (scope: "mine" | "public") => { ... };
export const updateTemplate = async (templateId: string, params: Partial<{ name: string; description: string; is_public: boolean }>) => { ... };
export const deleteTemplate = async (templateId: string) => { ... };
export const createFromTemplate = async (params: CommunityTemplateRequest["createFromTemplate"]) => { ... };
```

### React Query Hooks (`next-frontend/components/hooks/{communityNesting,communityTemplate}/`)

- `useSubCommunities(parentId)` — `useQuery`.
- `useBreadcrumb(communityId)` — `useQuery`, cheap/cacheable (`staleTime: Infinity` — a community's ancestry doesn't change after creation, matching `useTags`' rationale for its own `staleTime: Infinity`).
- `useParentRollup(parentId)` — `useQuery`.
- `useCreateSubCommunity(parentId)` — `useMutation`, invalidates `subCommunities(parentId)` and `parentRollup(parentId)`, toast "Sub-community created", navigates to it.
- `useTemplates(scope)` — `useQuery`.
- `useCreateTemplate()` — `useMutation`, invalidates `templates("mine")`, toast "Template saved".
- `useDeleteTemplate()` — `useMutation`, optimistic removal from the templates list.
- `useCreateFromTemplate()` — `useMutation`, navigates to the newly created community on success (not optimistic — needs the real id).

`queryKeys.communities` additions:

```ts
subCommunities: (parentId: string) => ({
  queryKey: [parentId, "sub-communities"],
  queryFn: async () => await CommunityNestingApi.listSubCommunities(parentId),
}),
breadcrumb: (communityId: string) => ({
  queryKey: [communityId, "breadcrumb"],
  queryFn: async () => await CommunityNestingApi.getBreadcrumb(communityId),
}),
parentRollup: (parentId: string) => ({
  queryKey: [parentId, "rollup"],
  queryFn: async () => await CommunityNestingApi.getParentRollup(parentId),
}),
templates: (scope: "mine" | "public") => ({
  queryKey: ["templates", scope],
  queryFn: async () => await CommunityTemplateApi.listTemplates(scope),
}),
```

### UI Components (`next-frontend/components/community/{nesting,templates}/`)

- `CommunityBreadcrumb.tsx` — "Faculty of Informatics / Algorithms Course" style trail, current community not a link, ancestor is.
- `SubCommunityList.tsx` — grid of sub-community cards under a parent's dashboard.
- `SubCommunityCard.tsx` — name, avatar, member count, own total minutes.
- `NewSubCommunityDialog.tsx` — same fields as the v1 community-create form, opened from a parent's dashboard, disabled entirely (button hidden, not just disabled, per convention of hiding actions a user can't take) if the current community is already a sub-community (depth limit).
- `ParentRollupSummary.tsx` — combined total + per-sub-community breakdown, shown on a parent community's dashboard above/alongside its own v1 aggregate widget.
- `SaveAsTemplateDialog.tsx` — name, description, public toggle, shows a read-only preview list of the tracked categories that will be snapshotted.
- `TemplateGallery.tsx` — tabbed "My templates" / "Public templates" browser, `TemplateCard` grid.
- `TemplateCard.tsx` — name, description, tracked-category chip preview, "Use this template" button.
- `CreateFromTemplateForm.tsx` — pre-filled create-community form (name/description blank, visibility/data-visibility pre-filled from the template, tracked categories shown read-only as "will be created") with an editable parent-community selector.

Primary user journey — creating a community from a public template:

1. User starts "Create a community" → offered a choice: **Start from scratch** or **Use a template** → picks the latter, opens `TemplateGallery`.
2. Browses the "Public templates" tab, finds "University Department" template, clicks **Use this template** on its `TemplateCard`.
3. `CreateFromTemplateForm` opens pre-filled with the template's default visibility/data-visibility and a read-only preview of the tracked categories it will create (e.g. "Lectures", "Assignments", "Office Hours"); user fills in the actual community name/description and optionally picks a parent community from a dropdown of communities where they're manager/owner.
4. Submits → `useCreateFromTemplate` creates the community and its tracked categories in one request, navigates to the new community's dashboard on success.
5. If the user picked a parent that's itself a sub-community, the server rejects with the depth-limit message and the form surfaces it inline near the parent selector rather than as a generic toast (this is a validation-shaped error tied to a specific field).

## UX & Polish

- **Loading state**: `SubCommunityList` and `TemplateGallery` render 3 skeleton cards; `ParentRollupSummary` renders a skeleton number block + skeleton bar chart row.
- **Empty state**:
  - No sub-communities yet (parent dashboard): "No sub-communities yet — split this community into departments, teams, or cohorts." primary button **Create a sub-community** (manager/owner only; hidden entirely for regular members rather than shown-disabled).
  - No templates (My templates tab): "You haven't saved any templates yet — save a community's structure to reuse it later." primary button **Save current community as template** (only shown when navigated to from within a community the user manages).
  - No public templates yet: "No public templates yet — be the first to share a reusable structure."
- **Error states** (toast copy):
  - Sub-community creation blocked by depth: inline field error near the parent field, "Sub-communities can't have their own sub-communities."
  - Save-as-template fails (permission race): title "Couldn't save template", description "You may no longer manage this community."
  - Create-from-template fails: title "Couldn't create community", description server message.
- **Optimistic updates**: deleting a template is optimistic (low-risk, reversible only by re-saving, matches the bar for "the user is staring at a list and expects the row to just go away"); everything else in this step involves creating a new entity the UI needs the real id for, so none of the create flows are optimistic.
- **Responsive (mobile)**: `CommunityBreadcrumb` truncates long ancestor names with an ellipsis and a tap-to-see-full-name tooltip rather than wrapping or overflowing horizontally — this is one of the three explicitly-called-out mobile treatments for this version, alongside forum threads and the calendar view; `SubCommunityList`/`TemplateGallery` grids collapse to a single column; `CreateFromTemplateForm`'s tracked-category preview list becomes a horizontally-scrollable chip row instead of a wrapped block.
- **Accessibility**: `CommunityBreadcrumb` uses `<nav aria-label="Breadcrumb">` with an ordered list (`<ol>`) of links per standard breadcrumb semantics, `aria-current="page"` on the final (non-link) entry; `TemplateCard`'s "Use this template" button has an `aria-label` including the template name; the public/private toggle in `SaveAsTemplateDialog` is a real checkbox/switch with a text label, not an icon-only toggle; depth-limit and other structural errors are associated with their triggering form field via `aria-describedby`, not just a floating toast, so screen reader users get the context inline.

## Acceptance Criteria

- [ ] Only manager/owner of a parent community can create a sub-community under it.
- [ ] A sub-community cannot itself have a sub-community; the attempt is rejected with a clear message, both client- and server-side.
- [ ] A community's `parent_community_id` cannot equal its own `id`.
- [ ] Joining a parent community does not grant membership in its sub-communities, and vice versa.
- [ ] The parent dashboard shows a combined rollup total (own + all direct sub-communities) in addition to its own v1 aggregate.
- [ ] Only manager/owner of a community can save it as a template.
- [ ] A private template (`is_public = false`) is visible only to its `created_by` user; a public one is visible to any authenticated user.
- [ ] Creating a community from a template creates the community plus one `community_tracked_category` row per entry in the template's `structure.tracked_categories`.
- [ ] Editing a template after communities were created from it does not retroactively change those communities.
- [ ] Only the template's `created_by` user can update or delete it.

## Testing Notes

- Backend (`cargo test`):
  - `community_nesting_service`:
    - `manager_can_create_sub_community`, `member_cannot_create_sub_community` (asserts `Err`).
    - `cannot_create_sub_community_under_a_sub_community` — seeds a 2-level tree, attempts a 3rd level, asserts `Err` with "max nesting depth is 2".
    - `community_cannot_be_own_parent` — asserts DB constraint violation surfaces as a clean `Err`, not a panic.
    - `parent_rollup_sums_all_sub_communities` — seeds a parent with two sub-communities with known totals, asserts `combined_total_minutes` equals the sum.
    - `joining_parent_does_not_grant_sub_community_membership` — asserts membership tables are independent.
  - `community_template_service`:
    - `manager_can_save_community_as_template` — asserts `structure.tracked_categories` matches the source community's non-archived tracked categories exactly.
    - `member_cannot_save_template` — asserts `Err`.
    - `private_template_not_visible_to_other_users` — asserts `list_public` excludes it and `list_own` for a different user excludes it.
    - `create_from_template_creates_matching_tracked_categories` — asserts the new community has one `community_tracked_category` per template entry, in the template's colors.
    - `editing_template_does_not_affect_previously_created_communities` — creates a community from a template, updates the template's structure, asserts the earlier community's tracked categories are unchanged.
    - `only_creator_can_update_or_delete_template` — asserts `Err` for a different user, including a different manager of the same source community.
- Frontend (Storybook stories under `next-frontend/stories/community/{nesting,templates}/`):
  - `CommunityBreadcrumb.stories.tsx` — TopLevel, WithParent, LongNameTruncated.
  - `SubCommunityList.stories.tsx` — Default, Empty, Loading.
  - `NewSubCommunityDialog.stories.tsx` — Default, ValidationErrors.
  - `ParentRollupSummary.stories.tsx` — Default, NoSubCommunities.
  - `TemplateGallery.stories.tsx` — MyTemplatesPopulated, MyTemplatesEmpty, PublicTemplatesPopulated, PublicTemplatesEmpty.
  - `SaveAsTemplateDialog.stories.tsx` — Default, PublicToggleOn.
  - `CreateFromTemplateForm.stories.tsx` — Default, DepthLimitError.
