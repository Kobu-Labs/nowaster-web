# Step 5: Bulk Operations

## Overview

The two previous management pain points at real community size: inviting
many people one at a time, and manually walking every new member through
category mapping. This step adds bulk invite (many usernames in one
submission, reusing Step 2's single-invite primitives per entry) and a
bulk category-mapping-suggestion tool — a manager reviews name-similarity
matches between members' personal categories and the community's tracked
categories (e.g. "these 30 students all have a category literally named
'CS101' or close to it") and applies the ones that look right in one
action. Both are **partial-success** operations: one bad row (a nonexistent
username, an already-mapped category) never blocks the rest of the batch.
Depends on Step 1 (manager+ permission gate) and Step 2 (bulk invite calls
the exact same per-invite logic Step 2 built, just looped with per-item
error capture).

## Scope

- In scope:
  - `POST /api/community/{id}/invite/bulk` — up to 100 usernames per
    submission, each processed independently through Step 2's existing
    direct-invite logic
  - `GET /api/community/{id}/mapping-suggestions` — name-similarity
    matches (via Postgres `pg_trgm`) between each member's personal
    categories and the community's tracked categories, excluding pairs
    already mapped
  - `POST /api/community/{id}/mapping-suggestions/apply` — apply a
    manager-selected subset of suggestions, creating
    `community_category_mapping` rows on affected members' behalf
  - A `community_bulk_operation` audit row per batch submission (invite
    or mapping) recording per-item outcomes, so a manager can see what
    happened after the fact rather than trusting an ephemeral toast
  - Bulk invite UI: paste/type a list of usernames, submit, see a
    per-username result table
  - Mapping suggestions UI: reviewable table grouped by tracked category,
    checkboxes, confidence indicator, bulk apply
- Explicitly deferred:
  - CSV/file upload for bulk invite (v2 ships a textarea of
    newline/comma-separated usernames; file parsing is a pure UI
    enhancement with no schema impact) (→ not currently planned, revisit
    if manager feedback asks for it)
  - Bulk role changes (promote/demote many members at once) (→ not
    currently planned; Step 1's per-member actions are the only role
    management surface in v2)
  - Auto-creating tracked categories from unmatched member category names
    (→ not currently planned; a manager still creates tracked categories
    explicitly via Step 1's retrofit of v1's tracked-category CRUD)
  - Undo for an applied bulk mapping batch (the audit row lets a manager
    *see* what was applied, but reversing it means manually unmapping
    per member for now) (→ v4, alongside other moderation tooling)

## Data Model

### Inherited from v1 / earlier v2 steps (read-only reference)

```sql
CREATE TABLE community_category_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    personal_category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
    tracked_category_id UUID NOT NULL REFERENCES community_tracked_category(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, personal_category_id, tracked_category_id)
);
```

Also inherited: `community_invite` and its `create_direct_invite` service
logic from Step 2, and the `pg_trgm` extension enabled in Step 3's
migration (`0063_add_community_member_count.sql`) — this step's
similarity query reuses it rather than re-enabling it.

### Migration: `backend/migrations/0065_create_community_bulk_operation.sql`

```sql
-- 0065_create_community_bulk_operation.sql

CREATE TYPE community_bulk_operation_type AS ENUM ('invite', 'category_mapping');
CREATE TYPE community_bulk_operation_status AS ENUM (
    'completed',
    'completed_with_errors',
    'failed'
);

CREATE TABLE community_bulk_operation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    operation_type community_bulk_operation_type NOT NULL,
    status community_bulk_operation_status NOT NULL,
    submitted_by TEXT NOT NULL REFERENCES "user"(id),
    total_count INTEGER NOT NULL,
    success_count INTEGER NOT NULL,
    failure_count INTEGER NOT NULL,
    -- array of {identifier, status, message}, e.g.
    -- [{"identifier": "alice", "status": "success", "message": null},
    --  {"identifier": "bob", "status": "failure", "message": "User not found"}]
    results JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_community_bulk_operation_community
    ON community_bulk_operation(community_id, created_at DESC);
```

### Rust entity changes (`backend/src/entity/community.rs`)

```rust
#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_bulk_operation_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityBulkOperationType {
    Invite,
    CategoryMapping,
}

#[derive(Clone, Debug, PartialEq, sqlx::Type, Deserialize, Serialize)]
#[sqlx(type_name = "community_bulk_operation_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum CommunityBulkOperationStatus {
    Completed,
    CompletedWithErrors,
    Failed,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CommunityBulkOperation {
    pub id: uuid::Uuid,
    pub community_id: uuid::Uuid,
    pub operation_type: CommunityBulkOperationType,
    pub status: CommunityBulkOperationStatus,
    pub submitted_by: String,
    pub total_count: i32,
    pub success_count: i32,
    pub failure_count: i32,
    pub results: serde_json::Value,
    pub created_at: chrono::DateTime<chrono::Local>,
}
```

## Backend Implementation

### Repository

`backend/src/repository/community/invite.rs` (extended from Step 2):

| Function | Purpose |
|---|---|
| `record_bulk_operation(&self, community_id: Uuid, op_type: CommunityBulkOperationType, submitted_by: &str, entries: &[BulkOperationResultEntryDto]) -> Result<CommunityBulkOperation>` | Persist the audit row after a batch completes |
| `list_bulk_operations(&self, community_id: Uuid, limit: i64) -> Result<Vec<CommunityBulkOperation>>` | Manager-facing history view |

`backend/src/repository/community/mapping.rs` (v1's category-mapping
repository, extended):

| Function | Purpose |
|---|---|
| `find_mapping_suggestions(&self, community_id: Uuid) -> Result<Vec<MappingSuggestionRow>>` | The `pg_trgm`-backed similarity query below |
| `bulk_create_mappings(&self, community_id: Uuid, selections: &[MappingSelectionDto]) -> Result<Vec<Result<Uuid, String>>>` | Insert each selection independently inside its own savepoint so one FK violation or duplicate doesn't abort the batch |

```rust
#[instrument(err, skip(self), fields(community_id = %community_id))]
pub async fn find_mapping_suggestions(
    &self,
    community_id: Uuid,
) -> Result<Vec<MappingSuggestionRow>> {
    let rows = crate::named_query!(
        "community_mapping_suggestions",
        sqlx::query(
            r#"
            SELECT
                m.user_id,
                u.displayname AS username,
                u.avatar_url,
                cat.id AS personal_category_id,
                cat.name AS personal_category_name,
                tc.id AS tracked_category_id,
                tc.name AS tracked_category_name,
                similarity(cat.name, tc.name) AS confidence,
                EXISTS (
                    SELECT 1 FROM community_category_mapping ccm
                    WHERE ccm.user_id = m.user_id
                        AND ccm.personal_category_id = cat.id
                        AND ccm.tracked_category_id = tc.id
                ) AS already_mapped
            FROM community_member m
            JOIN "user" u ON u.id = m.user_id
            JOIN category cat ON cat.created_by = m.user_id
            CROSS JOIN community_tracked_category tc
            WHERE m.community_id = $1 AND tc.community_id = $1
                AND similarity(cat.name, tc.name) > 0.3
            ORDER BY confidence DESC, tc.name ASC
            "#,
        )
        .bind(community_id)
        .fetch_all(self.db.get_pool())
    )?;
    // map rows -> Vec<MappingSuggestionRow> ...
}
```

The `0.3` similarity threshold is `pg_trgm`'s commonly-used default
(matches Postgres's own `pg_trgm.similarity_threshold` default) — it
catches "CS101" vs "cs 101" and "Algorithms" vs "algorithms grind" while
staying well clear of coincidental matches like "Math" vs "Marketing".

### Service (`backend/src/service/community_invite_service.rs`, extended for bulk invite; `backend/src/service/community_service.rs`, extended for bulk mapping)

Permission rules, stated exactly:

- **Bulk invite**: identical to Step 2's single invite — actor must have
  `role >= manager`. The batch-size cap (100) is enforced by
  `#[validate(length(max = 100))]` on the DTO, rejected before any
  per-item processing starts.
- **View mapping suggestions**: actor must have `role >= manager`. This
  surfaces other members' personal category *names* in aggregate to a
  manager, which is judged acceptable (category names are short labels a
  member already shares implicitly by joining a community and mapping
  them), but it is the one place in v2 where a manager sees data that
  isn't otherwise exposed at the community level — noted here explicitly
  rather than silently.
- **Apply mapping suggestions**: actor must have `role >= manager`. Each
  selection is validated against that specific `(user_id,
  personal_category_id, tracked_category_id)` triple actually existing
  as an *unmapped*, *similar* pair before insertion — a manager cannot
  submit arbitrary ids that weren't part of the suggestion set (prevents
  a manager silently mapping a member's category to an unrelated tracked
  category the similarity engine never suggested).

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct BulkInviteDto {
    pub community_id: Uuid,
    #[validate(length(min = 1, max = 100, message = "Provide between 1 and 100 usernames"))]
    pub usernames: Vec<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum BulkResultStatus {
    Success,
    Failure,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct BulkOperationResultEntryDto {
    pub identifier: String,
    pub status: BulkResultStatus,
    pub message: Option<String>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct BulkOperationResultDto {
    pub operation_id: Uuid,
    pub total_count: i32,
    pub success_count: i32,
    pub failure_count: i32,
    pub entries: Vec<BulkOperationResultEntryDto>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct MappingSuggestionDto {
    pub user: ReadUserDto,
    pub personal_category_id: Uuid,
    pub personal_category_name: String,
    pub tracked_category_id: Uuid,
    pub tracked_category_name: String,
    pub confidence: f32,
    pub already_mapped: bool,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct MappingSelectionDto {
    pub user_id: String,
    pub personal_category_id: Uuid,
    pub tracked_category_id: Uuid,
}

#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct ApplyMappingSuggestionsDto {
    pub community_id: Uuid,
    #[validate(length(min = 1, max = 200, message = "Select between 1 and 200 mappings"))]
    pub selections: Vec<MappingSelectionDto>,
}
```

```rust
#[instrument(err, skip(self), fields(community_id = %dto.community_id, count = dto.usernames.len(), actor_id = %actor))]
pub async fn bulk_invite(
    &self,
    dto: BulkInviteDto,
    actor: &Actor,
) -> Result<BulkOperationResultDto> {
    let acting_member = self
        .member_repo
        .get_member(dto.community_id, &actor.user_id)
        .await?
        .ok_or_else(|| anyhow::anyhow!("You are not a member of this community"))?;

    if !acting_member.role.can_manage_members() {
        return Err(anyhow::anyhow!(
            "You do not have permission to invite members to this community"
        ));
    }

    let mut entries = Vec::with_capacity(dto.usernames.len());

    for username in &dto.usernames {
        let result = self
            .create_direct_invite(
                CreateDirectInviteDto {
                    community_id: dto.community_id,
                    invitee_username: username.clone(),
                },
                actor,
            )
            .await;

        entries.push(match result {
            Ok(_) => BulkOperationResultEntryDto {
                identifier: username.clone(),
                status: BulkResultStatus::Success,
                message: None,
            },
            Err(e) => BulkOperationResultEntryDto {
                identifier: username.clone(),
                status: BulkResultStatus::Failure,
                message: Some(e.to_string()),
            },
        });
    }

    let success_count = entries.iter().filter(|e| e.status == BulkResultStatus::Success).count();
    let failure_count = entries.len() - success_count;

    let operation = self
        .invite_repo
        .record_bulk_operation(
            dto.community_id,
            CommunityBulkOperationType::Invite,
            &actor.user_id,
            &entries,
        )
        .await?;

    Ok(BulkOperationResultDto {
        operation_id: operation.id,
        total_count: entries.len() as i32,
        success_count: success_count as i32,
        failure_count: failure_count as i32,
        entries,
    })
}
```

Error cases (batch-level, returned instead of a `BulkOperationResultDto`
when the whole request is malformed rather than individual items
failing):

- `"You do not have permission to invite members to this community"`
- `"You do not have permission to manage this community's mappings"`
- `"Provide between 1 and 100 usernames"` (validator-level, before the
  service runs)
- `"One or more selected mappings were not part of the suggested set"` —
  a submitted `MappingSelectionDto` doesn't match any row
  `find_mapping_suggestions` would currently return

Per-item failure messages inside a successful (200) batch response
reuse Step 2's exact single-invite error strings (`"{username} is
already a member of this community"`, `"User not found"`, etc.) — bulk
invite doesn't invent new wording, it just captures the same errors
per-row instead of failing the whole request on the first one.

### Router

`backend/src/router/community/invite.rs` (extended):

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| POST | `/api/community/{community_id}/invite/bulk` | `bulk_invite_handler` | Actor, manager+ | Invite up to 100 usernames in one submission |
| GET | `/api/community/{community_id}/bulk-operations` | `list_bulk_operations_handler` | Actor, manager+ | Audit history of past bulk batches |

`backend/src/router/community/mapping.rs` (new file, or extends v1's
tracked-category router if one already exists there):

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/{community_id}/mapping-suggestions` | `get_mapping_suggestions_handler` | Actor, manager+ | Similarity-based suggested mappings |
| POST | `/api/community/{community_id}/mapping-suggestions/apply` | `apply_mapping_suggestions_handler` | Actor, manager+ | Bulk-create selected mappings |

```rust
#[instrument(skip(state), fields(community_id = %community_id, count = payload.usernames.len(), actor_id = %actor))]
async fn bulk_invite_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<BulkInviteBody>,
) -> ApiResponse<BulkOperationResultDto> {
    let result = state
        .community_invite_service
        .bulk_invite(
            BulkInviteDto { community_id, usernames: payload.usernames },
            &actor,
        )
        .await;
    ApiResponse::from_result(result)
}

#[instrument(skip(state), fields(community_id = %community_id, count = payload.selections.len(), actor_id = %actor))]
async fn apply_mapping_suggestions_handler(
    State(state): State<AppState>,
    Path(community_id): Path<Uuid>,
    actor: Actor,
    ValidatedRequest(payload): ValidatedRequest<ApplyMappingSuggestionsBody>,
) -> ApiResponse<BulkOperationResultDto> {
    let result = state
        .community_service
        .apply_mapping_suggestions(
            ApplyMappingSuggestionsDto {
                community_id,
                selections: payload.selections,
            },
            &actor,
        )
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas

`next-frontend/api/definitions/models/community-bulk.ts`:

```ts
export const BulkResultStatusSchema = z.enum(["success", "failure"]);

export const BulkOperationResultEntrySchema = z.object({
  identifier: z.string(),
  status: BulkResultStatusSchema,
  message: z.string().nullable(),
});

export const BulkOperationResultSchema = z.object({
  operationId: z.uuid(),
  totalCount: z.number().int(),
  successCount: z.number().int(),
  failureCount: z.number().int(),
  entries: z.array(BulkOperationResultEntrySchema),
});
export type BulkOperationResult = z.infer<typeof BulkOperationResultSchema>;

export const MappingSuggestionSchema = z.object({
  user: UserSchema,
  personalCategoryId: z.uuid(),
  personalCategoryName: z.string(),
  trackedCategoryId: z.uuid(),
  trackedCategoryName: z.string(),
  confidence: z.number().min(0).max(1),
  alreadyMapped: z.boolean(),
});
export type MappingSuggestion = z.infer<typeof MappingSuggestionSchema>;
```

`next-frontend/api/definitions/requests/community/bulk.ts`:

```ts
const bulkInvite = z.object({
  usernames: z
    .array(z.string().min(1))
    .min(1, "Add at least one username")
    .max(100, "Invite up to 100 users at a time"),
});

const applySuggestions = z.object({
  selections: z
    .array(
      z.object({
        userId: z.string(),
        personalCategoryId: z.uuid(),
        trackedCategoryId: z.uuid(),
      }),
    )
    .min(1, "Select at least one mapping to apply"),
});

export const CommunityBulkRequestSchema = { bulkInvite, applySuggestions };
export type CommunityBulkRequest = {
  [K in keyof typeof CommunityBulkRequestSchema]: z.infer<
    (typeof CommunityBulkRequestSchema)[K]
  >;
};
```

`next-frontend/validation/bulk-invite.ts` (form-level: raw textarea text
parsed into the array the API expects):

```ts
export const bulkInviteFormSchema = z.object({
  usernamesRaw: z.string().min(1, "Enter at least one username"),
});
export type BulkInviteFormValues = z.infer<typeof bulkInviteFormSchema>;

export const parseUsernames = (raw: string): string[] =>
  Array.from(
    new Set(
      raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  );
```

### API Client (`next-frontend/api/communityBulk.ts`, new file)

```ts
export const bulkInvite = async (
  communityId: string,
  params: CommunityBulkRequest["bulkInvite"],
) => {
  const { data } = await baseApi.post(
    `/community/${communityId}/invite/bulk`,
    params,
  );
  return await parseResponseUnsafe(data, BulkOperationResultSchema);
};

export const getMappingSuggestions = async (communityId: string) => {
  const { data } = await baseApi.get(
    `/community/${communityId}/mapping-suggestions`,
  );
  return await parseResponseUnsafe(data, z.array(MappingSuggestionSchema));
};

export const applyMappingSuggestions = async (
  communityId: string,
  params: CommunityBulkRequest["applySuggestions"],
) => {
  const { data } = await baseApi.post(
    `/community/${communityId}/mapping-suggestions/apply`,
    params,
  );
  return await parseResponseUnsafe(data, BulkOperationResultSchema);
};

export const listBulkOperations = async (communityId: string) => {
  const { data } = await baseApi.get(
    `/community/${communityId}/bulk-operations`,
  );
  return await parseResponseUnsafe(data, z.array(BulkOperationSchema));
};
```

### React Query Hooks

- `useBulkInvite(communityId: string)` — mutation, not optimistic (the
  per-row server results *are* the UI payload, there's nothing to
  predict client-side)
- `useMappingSuggestions(communityId: string)` — `useQuery`
- `useApplyMappingSuggestions(communityId: string)` — mutation,
  **optimistic**: selected rows flip to `alreadyMapped: true` immediately
  in the cached suggestions list, rolled back per-row if that specific
  selection comes back as a failure in the response (not just on total
  request failure — see below)
- `useBulkOperationHistory(communityId: string)` — `useQuery`

`queryKeys.communities.*` additions:

```ts
const communityKeys = createQueryKeys("communities", {
  // ...members, capabilities, invites, inbox, discover, leaderboard from Steps 1-4
  mappingSuggestions: (communityId: string) => ({
    queryFn: async () => await CommunityBulkApi.getMappingSuggestions(communityId),
    queryKey: [communityId, "mapping-suggestions"],
  }),
  bulkOperations: (communityId: string) => ({
    queryFn: async () => await CommunityBulkApi.listBulkOperations(communityId),
    queryKey: [communityId, "bulk-operations"],
  }),
});
```

`useApplyMappingSuggestions`, with per-row rollback since the response
contains a mix of successes and failures rather than one boolean:

```ts
export const useApplyMappingSuggestions = (communityId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const key = queryKeys.communities.mappingSuggestions(communityId).queryKey;

  return useMutation({
    mutationFn: async (selections: CommunityBulkRequest["applySuggestions"]["selections"]) =>
      await CommunityBulkApi.applyMappingSuggestions(communityId, { selections }),
    onMutate: async (selections) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MappingSuggestion[]>(key);

      queryClient.setQueryData<MappingSuggestion[]>(key, (old) =>
        old?.map((s) =>
          selections.some(
            (sel) =>
              sel.userId === s.user.id
              && sel.personalCategoryId === s.personalCategoryId
              && sel.trackedCategoryId === s.trackedCategoryId,
          )
            ? { ...s, alreadyMapped: true }
            : s,
        ),
      );

      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast({
        description: error.message,
        title: "Couldn't apply mappings",
        variant: "destructive",
      });
    },
    onSuccess: async (result) => {
      if (result.failureCount > 0) {
        // Some selections failed individually — refetch to reconcile
        // exact per-row state rather than trusting the optimistic patch.
        await queryClient.invalidateQueries({ queryKey: key });
        toast({
          description: `${result.successCount} applied, ${result.failureCount} failed. See details below.`,
          title: "Applied with some errors",
          variant: "default",
        });
      } else {
        toast({
          description: `Applied ${result.successCount} category mapping${result.successCount === 1 ? "" : "s"}.`,
          title: "Mappings applied",
        });
      }
    },
  });
};
```

### UI Components

- `components/visualizers/communities/BulkInviteDialog.tsx` — textarea
  (newline/comma-separated usernames), live count ("14 usernames"),
  submit button
- `components/visualizers/communities/BulkInviteResultsTable.tsx` —
  post-submit table: username, status icon, error message if failed
- `components/visualizers/communities/MappingSuggestionsPanel.tsx` —
  table grouped by tracked category, each row a checkbox + member +
  suggested personal category + confidence badge ("92% match"), an
  "Apply Selected" button in the toolbar
- `components/visualizers/communities/MappingSuggestionRow.tsx` —
  single row, disables its checkbox and shows a muted "Already mapped"
  label when `alreadyMapped`
- `components/visualizers/communities/BulkOperationHistory.tsx` — past
  batches list (type, submitted-by, success/fail counts, timestamp),
  expandable to the full per-item table (reuses
  `BulkInviteResultsTable`'s row rendering for any operation type)

Primary flow — bulk-applying category mapping suggestions:

1. Manager opens **Members → Bulk tools → Category mappings**.
   `MappingSuggestionsPanel` mounts, `useMappingSuggestions` fires,
   showing a grouped table: for tracked category "Algorithms", five
   members whose personal category names ("Algo grind", "CS 101
   algorithms", ...) scored above the similarity threshold, each with a
   confidence badge and a checkbox.
2. Manager reviews the list — a 95% match is pre-checked by default, a
   62% match is not (a confidence threshold, e.g. ≥0.85, drives the
   default checkbox state, but all rows above the 0.3 server-side floor
   are shown and manually toggleable).
3. Manager unchecks one row that looks wrong ("Algorithmic Trading"
   nearly matched "Algorithms" — a false positive), leaves the rest,
   clicks "Apply Selected (7)".
4. `useApplyMappingSuggestions` fires; the 7 selected rows optimistically
   show "Already mapped" immediately.
5. Response comes back with 6 successes and 1 failure (one member's
   category was deleted moments earlier by that member). The toast reads
   "6 applied, 1 failed. See details below." and the panel refetches to
   reconcile — the failed row reverts to selectable (not stuck showing
   "Already mapped" incorrectly) and gets a small inline error note.
6. Manager can open **Bulk tools → History** to see this batch recorded
   with its exact per-row outcome, timestamped, for later reference.

## UX & Polish

- **Loading state**: `MappingSuggestionsPanel` shows 5 skeleton rows
  grouped under one skeleton category header; `BulkInviteDialog`'s
  submit button shows a spinner + "Inviting 14 users..." text during
  submission (a bulk action is exactly the case where a bare spinner
  isn't enough context).
- **Empty states**:
  - No mapping suggestions found: "No likely matches found. Members'
    category names don't closely resemble any tracked category yet —
    they can still map manually from their own dashboard." (not framed
    as an error; this is a normal outcome for a young or loosely-named
    community)
  - No bulk operations in history yet: "No bulk actions yet. Bulk invite
    and mapping tools will show up here once you use them."
- **Error states** (toast copy):
  - Whole-batch rejection (validation): `"Invite up to 100 users at a
    time"` / `"Select at least one mapping to apply"` — inline form
    error, not a toast, caught before submission.
  - Partial failure (see flow step 5): non-destructive toast summarizing
    counts, full detail in the results table, never just "Something went
    wrong."
  - Total request failure (network/500): `"Couldn't complete the bulk
    invite — {server message}. No invites were sent."` — explicitly
    reassures the manager nothing partially happened, since this is the
    one case where the whole batch genuinely didn't run.
- **Optimistic update**: mapping-suggestion apply optimistically flips
  selected rows to "Already mapped," reconciled against real per-row
  results on response (see hook above); bulk invite is not optimistic
  end-to-end since its entire value is the per-row server verdict.
- **Responsive**: `MappingSuggestionsPanel`'s table collapses to one
  card per suggestion below `640px` (checkbox, member, confidence badge,
  and category names stacked), matching the card-collapse pattern used
  by `MemberList` and `InviteManagementList`.
- **Accessibility**:
  - Bulk selection uses a real `<input type="checkbox">` per row plus a
    header-level "select all above threshold" checkbox with
    `aria-label="Select all high-confidence matches"`.
  - Confidence is shown as both a percentage *and* a short qualitative
    label ("92% · Strong match", "45% · Weak match") so it isn't
    conveyed by badge color alone.
  - The bulk-invite textarea has a live username count
    (`aria-live="polite"`, "14 usernames entered") so screen reader
    users get the same feedback sighted users get from the visible
    counter.
  - `BulkInviteResultsTable` and `BulkOperationHistory` use real table
    markup (`<table>`/`<th scope="col">`) for correct screen-reader
    column announcement.

## Acceptance Criteria

- [ ] Bulk invite processes each username independently; one failure
      (nonexistent user, existing member, duplicate pending invite) does
      not prevent the other usernames in the same batch from succeeding.
- [ ] Bulk invite request is rejected outright (no partial processing)
      if the username list is empty or exceeds 100 entries.
- [ ] Every bulk invite/mapping-apply batch produces exactly one
      `community_bulk_operation` row with `total_count = success_count +
      failure_count`.
- [ ] `find_mapping_suggestions` never returns a pair already present in
      `community_category_mapping` as a *default-selected* suggestion —
      it's returned with `already_mapped: true` for display/disable
      purposes but excluded from what a "select all" action would check.
- [ ] `apply_mapping_suggestions` rejects any selection whose
      `(user_id, personal_category_id, tracked_category_id)` triple was
      not present in the current suggestion set for that community.
- [ ] A member (not manager/owner) receives a permission error from all
      four bulk endpoints.
- [ ] The mapping-suggestions UI's optimistic "Already mapped" state
      reconciles correctly when the server reports a per-row failure
      (reverts that specific row, keeps the successful ones).
- [ ] Similarity threshold (`0.3`) is enforced server-side, not just as
      a UI filter — the endpoint never returns pairs below it.

## Testing Notes

- **Backend**:
  - `test_bulk_invite_partial_success_does_not_abort_batch`
  - `test_bulk_invite_rejects_empty_list`
  - `test_bulk_invite_rejects_over_100_usernames`
  - `test_bulk_invite_records_operation_audit_row`
  - `test_mapping_suggestions_excludes_already_mapped_from_default_selection`
  - `test_mapping_suggestions_respects_similarity_threshold`
  - `test_apply_mapping_suggestions_rejects_selection_outside_suggested_set`
  - `test_apply_mapping_suggestions_partial_success_per_row`
  - `test_bulk_endpoints_reject_non_manager_actor`
- **Frontend** (Storybook):
  - `BulkInviteDialog.stories.tsx` — empty, valid list, over-limit
    validation error, submitting
  - `BulkInviteResultsTable.stories.tsx` — all success, mixed
    success/failure, all failure
  - `MappingSuggestionsPanel.stories.tsx` — grouped suggestions with
    varying confidence, empty (no matches), post-apply partial-failure
    state (some rows reverted)
  - `MappingSuggestionRow.stories.tsx` — high confidence (pre-checked),
    low confidence (unchecked), already-mapped (disabled)
  - `BulkOperationHistory.stories.tsx` — empty, list with expandable
    rows for both operation types
