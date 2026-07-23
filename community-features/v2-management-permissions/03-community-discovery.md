# Step 3: Community Discovery

## Overview

v1 communities are invisible unless you already have a link or a direct
invite. This step adds a browse/search surface for `public` communities —
search by name/description, filter by tracked-category keyword, sort by
member count, recent activity, or newest — so a public community can
actually be found instead of only shared. It depends on Step 1's role
model only incidentally (a "Join" action from discovery is identical to
v1's direct-join flow, gated the same way) and on Step 2 not at all
(discovery surfaces public communities you can join directly; invite-only
communities never appear here, matching v1's join rules — invite-only
communities remain invite-only for discovery purposes, they just don't
show up in the results at all rather than showing up as "request access").

## Scope

- In scope:
  - `community.member_count` denormalized column, kept in sync via
    triggers on `community_member` insert/delete (the locked cross-version
    decision from the roadmap README)
  - `GET /api/community/discover` — search by name/description substring,
    optional tracked-category keyword filter, sort by `members` /
    `activity` / `newest`, paginated
  - Activity sort is computed at query time from the last 30 days of
    mapped session time (same "no denormalization/caching yet" philosophy
    v1 used for its dashboard aggregation) — explicitly flagged as a
    revisit-if-slow item, not solved with caching in v2
  - A lightweight category-keyword autocomplete endpoint, sourced from
    distinct `community_tracked_category.name` values across public
    communities
  - Discovery UI: search bar, sort selector, results grid, "Join" action
    per result (public communities only — join is instant, no invite
    needed, matching v1)
- Explicitly deferred:
  - Full-text search / ranking (typo tolerance, relevance scoring beyond
    `ILIKE`) — plain substring match is enough for v2's community count
    (→ revisit only if real usage shows it's needed, no version currently
    slated)
  - Caching/materializing the activity sort behind a scheduled job (→ v3,
    if `community_activity_event` from v3 makes this cheap as a
    side-effect)
  - Discovery of `invite_only` communities in any form (e.g. "request to
    join") (→ not currently planned; invite-only stays invite-only)
  - Personalized recommendations ("communities like yours") (→ not
    currently planned)

## Data Model

### Inherited from v1 / Step 1 (read-only reference)

```sql
CREATE TABLE community (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    avatar_url VARCHAR,
    visibility community_visibility NOT NULL DEFAULT 'invite_only', -- 'public' | 'invite_only'
    data_visibility community_data_visibility NOT NULL DEFAULT 'members_only',
    created_by TEXT NOT NULL REFERENCES "user"(id),
    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Migration: `backend/migrations/0063_add_community_member_count.sql`

```sql
-- 0063_add_community_member_count.sql

ALTER TABLE community ADD COLUMN member_count INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing membership rows.
UPDATE community c
SET member_count = sub.cnt
FROM (
    SELECT community_id, COUNT(*) AS cnt
    FROM community_member
    GROUP BY community_id
) sub
WHERE c.id = sub.community_id;

CREATE OR REPLACE FUNCTION community_member_count_increment() RETURNS TRIGGER AS $$
BEGIN
    UPDATE community SET member_count = member_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION community_member_count_decrement() RETURNS TRIGGER AS $$
BEGIN
    UPDATE community SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_community_member_count_increment
    AFTER INSERT ON community_member
    FOR EACH ROW EXECUTE FUNCTION community_member_count_increment();

CREATE TRIGGER trg_community_member_count_decrement
    AFTER DELETE ON community_member
    FOR EACH ROW EXECUTE FUNCTION community_member_count_decrement();

CREATE INDEX idx_community_discovery
    ON community(visibility, archived_at, member_count DESC)
    WHERE visibility = 'public' AND archived_at IS NULL;

CREATE INDEX idx_community_name_search
    ON community USING gin (name gin_trgm_ops);
-- Requires the pg_trgm extension; enable it if not already present:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Note: enabling `pg_trgm` lets `ILIKE '%query%'` searches use the trigram
index instead of a sequential scan — worth doing now since v1 had no
search surface at all and this is the first one. If `pg_trgm` cannot be
enabled in the target environment (e.g. a managed Postgres without
superuser), fall back to a plain B-tree on `lower(name)` and accept a
seq scan on the (still small) `community` table for the description
search only.

### Rust entity changes

`backend/src/entity/community.rs` — the existing `Community` struct grows
one field:

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Community {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub visibility: CommunityVisibility,
    pub data_visibility: CommunityDataVisibility,
    pub created_by: String,
    pub member_count: i32, // new in v2
    pub archived_at: Option<DateTime<Local>>,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}
```

## Backend Implementation

### Repository (`backend/src/repository/community/discovery.rs`, new file)

| Function | Purpose |
|---|---|
| `search_public_communities(&self, filter: DiscoverCommunitiesFilter, actor_id: &str) -> Result<(Vec<CommunitySearchRow>, i64)>` | Main search query — name/description `ILIKE`, optional tracked-category keyword join, sort branch, `LIMIT`/`OFFSET`, plus a `COUNT(*) OVER()` for total; also left-joins `community_member` for the requesting actor to compute `is_member` |
| `list_distinct_tracked_category_names(&self, prefix: &str, limit: i64) -> Result<Vec<String>>` | Autocomplete source for the category filter |

The sort branch matters enough to show directly — this is the query-time
"activity" computation, joining through the same
`community_category_mapping` table v1's dashboard aggregation already
uses:

```rust
#[instrument(err, skip(self), fields(query = ?filter.query, sort = ?filter.sort))]
pub async fn search_public_communities(
    &self,
    filter: DiscoverCommunitiesFilter,
    actor_id: &str,
) -> Result<(Vec<CommunitySearchRow>, i64)> {
    let order_by = match filter.sort {
        DiscoverySort::Members => "c.member_count DESC, c.created_at DESC",
        DiscoverySort::Newest => "c.created_at DESC",
        // Activity: total mapped minutes across all members in the last
        // 30 days. Computed at query time, same "correctness over scale"
        // stance v1 took for its own dashboard aggregation.
        DiscoverySort::Activity => "recent_minutes DESC, c.member_count DESC",
    };

    let rows = crate::named_query!(
        "community_discover_search",
        sqlx::query(&format!(
            r#"
            WITH recent_activity AS (
                SELECT
                    ccm.community_id,
                    COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 60), 0) AS recent_minutes
                FROM community_category_mapping ccm
                JOIN session s
                    ON s.category_id = ccm.personal_category_id
                    AND s.user_id = ccm.user_id
                    AND s.start_time > now() - interval '30 days'
                GROUP BY ccm.community_id
            )
            SELECT
                c.id, c.name, c.description, c.avatar_url, c.member_count,
                c.created_at,
                COALESCE(ra.recent_minutes, 0) AS recent_minutes,
                (m.user_id IS NOT NULL) AS is_member,
                COUNT(*) OVER() AS total_count
            FROM community c
            LEFT JOIN recent_activity ra ON ra.community_id = c.id
            LEFT JOIN community_member m ON m.community_id = c.id AND m.user_id = $1
            WHERE c.visibility = 'public'
                AND c.archived_at IS NULL
                AND ($2::text IS NULL OR c.name ILIKE '%' || $2 || '%' OR c.description ILIKE '%' || $2 || '%')
                AND ($3::text IS NULL OR EXISTS (
                    SELECT 1 FROM community_tracked_category tc
                    WHERE tc.community_id = c.id AND tc.name ILIKE '%' || $3 || '%'
                ))
            ORDER BY {order_by}
            LIMIT $4 OFFSET $5
            "#
        ))
        .bind(actor_id)
        .bind(&filter.query)
        .bind(&filter.category)
        .bind(filter.limit.unwrap_or(20))
        .bind(filter.offset.unwrap_or(0))
        .fetch_all(self.db.get_pool())
    )?;
    // map rows to (Vec<CommunitySearchRow>, total_count) ...
}
```

### Service (`backend/src/service/community_service.rs`, extended)

Permission rules: none beyond authentication — any signed-in user can
search and see any `public`, non-archived community's discovery card.
Joining a public community from discovery reuses v1's `join_community`
method unchanged (no new permission logic; v1 already only requires the
community be `public` and the actor not already a member).

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct DiscoverCommunitiesDto {
    pub query: Option<String>,
    pub category: Option<String>,
    #[serde(default)]
    pub sort: DiscoverySort,
    #[validate(range(min = 1, max = 50))]
    pub limit: Option<i64>,
    #[validate(range(min = 0))]
    pub offset: Option<i64>,
}

#[derive(Clone, Default, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")]
pub enum DiscoverySort {
    #[default]
    Members,
    Activity,
    Newest,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct CommunitySearchResultDto {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub avatar_url: Option<String>,
    pub member_count: i32,
    pub recent_activity_minutes: i64,
    pub is_member: bool,
    pub created_at: DateTime<Local>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DiscoverCommunitiesResultDto {
    pub results: Vec<CommunitySearchResultDto>,
    pub total_count: i64,
}
```

Error cases: none of note — an empty/invalid query returns an empty
result set, not an error; `limit`/`offset` are bounds-checked by
`validator::Validate` and rejected by `ValidatedRequest` before reaching
the service (`limit` capped at 50 to keep the activity-sort query cheap).

### DTOs

(Shown above — `DiscoverCommunitiesDto`, `CommunitySearchResultDto`,
`DiscoverCommunitiesResultDto`.) Additionally:

```rust
#[derive(Clone, Serialize, Deserialize, Validate, Debug)]
pub struct CategoryAutocompleteDto {
    #[validate(length(min = 1))]
    pub prefix: String,
}
```

### Router (`backend/src/router/community/discovery.rs`, new file)

| Method | Path | Handler | Auth | Description |
|---|---|---|---|---|
| GET | `/api/community/discover` | `discover_communities_handler` | Actor | Search/browse public communities |
| GET | `/api/community/discover/categories` | `autocomplete_categories_handler` | Actor | Category-keyword suggestions for the filter input |

```rust
use axum::{
    extract::{Query, State},
    routing::get,
    Router,
};

use crate::{
    router::{clerk::Actor, response::ApiResponse, root::AppState},
    service::community_service::DiscoverCommunitiesDto,
};

pub fn community_discovery_router() -> Router<AppState> {
    Router::new()
        .route("/discover", get(discover_communities_handler))
        .route("/discover/categories", get(autocomplete_categories_handler))
}

#[instrument(skip(state), fields(user_id = %actor, query = ?payload.query, sort = ?payload.sort))]
async fn discover_communities_handler(
    State(state): State<AppState>,
    Query(payload): Query<DiscoverCommunitiesDto>,
    actor: Actor,
) -> ApiResponse<DiscoverCommunitiesResultDto> {
    let result = state
        .community_service
        .discover_communities(payload, &actor)
        .await;
    ApiResponse::from_result(result)
}
```

## Frontend Implementation

### Types & Schemas

`next-frontend/api/definitions/models/community-search.ts`:

```ts
export const DiscoverySortSchema = z.enum(["members", "activity", "newest"]);

export const CommunitySearchResultSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  memberCount: z.number().int(),
  recentActivityMinutes: z.number().int(),
  isMember: z.boolean(),
  createdAt: z.coerce.date<Date>(),
});
export type CommunitySearchResult = z.infer<typeof CommunitySearchResultSchema>;

export const DiscoverCommunitiesResultSchema = z.object({
  results: z.array(CommunitySearchResultSchema),
  totalCount: z.number().int(),
});
```

`next-frontend/api/definitions/requests/community/discover.ts`:

```ts
const search = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  sort: DiscoverySortSchema.default("members"),
  limit: z.number().int().min(1).max(50).default(20),
  offset: z.number().int().min(0).default(0),
});

export const CommunityDiscoverRequestSchema = { search };
export type CommunityDiscoverRequest = {
  [K in keyof typeof CommunityDiscoverRequestSchema]: z.infer<
    (typeof CommunityDiscoverRequestSchema)[K]
  >;
};
```

### API Client (`next-frontend/api/communityDiscovery.ts`, new file)

```ts
export const discoverCommunities = async (
  params: CommunityDiscoverRequest["search"],
) => {
  const { data } = await baseApi.get("/community/discover", { params });
  return await parseResponseUnsafe(data, DiscoverCommunitiesResultSchema);
};

export const autocompleteCategories = async (prefix: string) => {
  const { data } = await baseApi.get("/community/discover/categories", {
    params: { prefix },
  });
  return await parseResponseUnsafe(data, z.array(z.string()));
};
```

### React Query Hooks

- `useDiscoverCommunities(filters: CommunityDiscoverRequest["search"])` —
  `useQuery`, `keepPreviousData: true` so pagination/sort changes don't
  flash the loading skeleton over already-visible results
- `useCategoryAutocomplete(prefix: string)` — debounced, `enabled:
  prefix.length > 0`, following `useSearchUsers`'s debounce pattern
  exactly
- `useJoinCommunity()` — reused from v1 unchanged; discovery just calls
  it and, on success, invalidates `queryKeys.communities.discover` so the
  joined card's `isMember` flips without a full page reload

`queryKeys.communities.*` addition:

```ts
const communityKeys = createQueryKeys("communities", {
  // ...members, capabilities, invites, inbox from Steps 1-2
  discover: (filters: CommunityDiscoverRequest["search"]) => ({
    queryFn: async () => await CommunityDiscoveryApi.discoverCommunities(filters),
    queryKey: [filters],
  }),
});
```

`useCategoryAutocomplete`, following `useSearchUsers`:

```ts
export const useCategoryAutocomplete = (prefix: string, debounceMs = 250) => {
  const [debounced, setDebounced] = useState(prefix);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(prefix), debounceMs);
    return () => clearTimeout(timer);
  }, [prefix, debounceMs]);

  return useQuery({
    enabled: debounced.trim().length > 0,
    queryFn: () => CommunityDiscoveryApi.autocompleteCategories(debounced),
    queryKey: ["community-category-autocomplete", debounced],
  });
};
```

### UI Components

- `components/pages/communities/DiscoverCommunities.tsx` — page-level
  container: search bar, sort select, results grid, pagination
- `components/visualizers/communities/CommunitySearchBar.tsx` — `Input`
  with `Search` icon (identical layout to `FriendsList`'s search input),
  debounced via local state + the 300ms pattern from `useSearchUsers`
- `components/visualizers/communities/CommunitySortSelect.tsx` —
  `shadcn/select` with three options: "Most members", "Most active",
  "Newest"
- `components/visualizers/communities/CategoryFilterCombobox.tsx` —
  `shadcn/command`-based combobox (matching `CategoryPicker.tsx`'s
  existing pattern) wired to `useCategoryAutocomplete`
- `components/visualizers/communities/CommunityCard.tsx` — avatar, name,
  description (truncated), member count, "Active this month: Xh" derived
  from `recentActivityMinutes`, and a Join button (or a "Joined" badge if
  `isMember`)
- `components/visualizers/communities/CommunityResultsGrid.tsx` —
  responsive grid + "Load more" pagination (offset-based, appends to the
  existing result list rather than replacing it, matching an infinite-
  scroll feel without actual IntersectionObserver complexity)
- `app/home/communities/discover/page.tsx` — routes to
  `DiscoverCommunities`

Primary flow — searching and joining a public community:

1. User navigates to **Communities → Discover**
   (`app/home/communities/discover`). `DiscoverCommunities` mounts with
   default filters (`sort: "members"`, empty query), firing
   `useDiscoverCommunities` immediately so the page isn't empty on load.
2. User types "algorithms" into `CommunitySearchBar`. After the 300ms
   debounce, `query` updates and `useDiscoverCommunities` refetches;
   `keepPreviousData` keeps the prior grid visible (slightly dimmed) until
   the new page resolves, avoiding a loading-skeleton flash on every
   keystroke pause.
3. Results show `CommunityCard`s for public communities whose name,
   description, or a tracked category matches. User switches
   `CommunitySortSelect` to "Most active"; the grid re-sorts by
   `recentActivityMinutes`.
4. User clicks "Join" on a card. `useJoinCommunity` (v1's mutation) fires;
   on success the card's button swaps to a disabled "Joined" state and a
   toast reads "You joined {name}."
5. User clicks the card itself (not the Join button) to navigate to
   `app/home/communities/[id]`, landing on v1's community dashboard —
   discovery is a funnel into the existing dashboard, not a new
   destination.

## UX & Polish

- **Loading state**: initial load shows 6 `CommunityCard` skeletons in
  the grid (matching card dimensions, not generic bars); subsequent
  filter/sort changes use `keepPreviousData` instead of re-showing
  skeletons.
- **Empty state**:
  - No public communities exist at all yet (very early product state):
    "No public communities yet. Be the first — create one and make it
    public." with a button to the create-community flow (v1).
  - Search/filter yields nothing: "No communities found for
    \"{query}\". Try a different search, or clear filters to browse
    everything." with a "Clear filters" button.
- **Error states** (toast copy):
  - Search request fails: inline error card in place of the grid —
    "Couldn't load communities right now. Try again." with a Retry
    button (not a toast, since this is the primary content of the page,
    not a side effect of an action).
  - Join failure from a discovery card: `"Couldn't join {name} —
    {server message}"`.
- **Optimistic update**: joining a community optimistically flips that
  card's `isMember` to `true` and disables the Join button immediately
  (via `onMutate` on the shared `useJoinCommunity` mutation, patching the
  matching entry across all cached `discover` query keys), rolling back
  on error.
- **Responsive**: grid is 1 column below `640px`, 2 at `sm:`, 3 at
  `lg:`; the search bar and sort select stack vertically on mobile
  instead of sitting side-by-side.
- **Accessibility**:
  - `CommunitySortSelect` is a real `<select>`-backed `shadcn/select`,
    fully keyboard operable, with a visible label ("Sort by") not just a
    placeholder.
  - `CommunityCard`'s Join button has `aria-label="Join {name}"` since
    the visible label is just "Join" repeated across many cards.
  - Search input has `aria-label="Search communities"` in addition to
    its placeholder (placeholders aren't a substitute for labels).
  - Grid announces result count changes via a visually-hidden
    `aria-live="polite"` region: "12 communities found."

## Acceptance Criteria

- [ ] `community.member_count` stays correct across join/leave/removal —
      verified by triggers, not application-side increments (so it can't
      drift if a row is deleted outside the service layer, e.g. by a
      cascade).
- [ ] `invite_only` communities never appear in `/api/community/discover`
      results regardless of query/sort/filter.
- [ ] Archived communities (`archived_at IS NOT NULL`) never appear in
      results.
- [ ] Sorting by `members` orders strictly by `member_count DESC`.
- [ ] Sorting by `activity` orders by summed mapped-session minutes in
      the trailing 30 days, `DESC`.
- [ ] A community with zero tracked-category mappings and zero recent
      activity still appears (at the bottom) when sorted by `activity`,
      not excluded.
- [ ] `is_member` correctly reflects the requesting actor's membership,
      not a global flag.
- [ ] `limit` is clamped to the 1–50 range server-side even if the client
      sends something outside it.
- [ ] Category filter matches are case-insensitive substring matches
      against `community_tracked_category.name`.

## Testing Notes

- **Backend**:
  - `test_discover_excludes_invite_only_communities`
  - `test_discover_excludes_archived_communities`
  - `test_discover_sort_by_members_desc`
  - `test_discover_sort_by_activity_uses_30_day_window`
  - `test_discover_is_member_flag_correct_for_actor`
  - `test_discover_category_filter_matches_tracked_category_name`
  - `test_member_count_trigger_increments_on_join`
  - `test_member_count_trigger_decrements_on_leave_and_removal`
  - `test_discover_limit_clamped_server_side`
- **Frontend** (Storybook):
  - `CommunityCard.stories.tsx` — not-a-member, already-a-member,
    zero-activity, long-description-truncation
  - `CommunitySearchBar.stories.tsx` — idle, typing (debounce visual),
    with a value cleared via the clear button
  - `CommunitySortSelect.stories.tsx` — all three sort options
  - `DiscoverCommunities.stories.tsx` — loading, populated, empty (no
    communities at all), empty (no search matches), error
