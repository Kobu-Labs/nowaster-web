# Community Features — Implementation Roadmap

This is the step-by-step implementation plan for the feature set described in
[`../COMMUNITY_FEATURES_PLANNING.md`](../COMMUNITY_FEATURES_PLANNING.md). That
document is the idea list; this folder is the build plan.

## Why this shape

The codebase today is strictly single-user: sessions, categories, and tags
each belong to exactly one `user_id`/`created_by`, the only social feature is
1:1 friends (`friend`/`friend_request` tables), and there's no team/org/group
entity anywhere — just a dormant `GROUPS` bit in `VisibilityFlags`
(`backend/src/entity/visibility.rs`) with no data behind it. Communities is
new ground, not an extension of an existing model.

Rather than versioning by feature *category* (v1 = core plumbing, v2 =
gamification, v3 = social, ...), each version below is a **breadth-first
slice**: most feature areas exist in every version, just narrower in scope,
so the product is coherent and demoable at the end of each version rather
than only at the very end. Some features are deliberately absent until later
versions where noted.

Every step file is a **vertical slice** — schema → migration → entity →
repository → service → DTOs → router → frontend Zod schemas → API client →
React Query hooks → UI components → polish (loading/empty/error states,
responsive behavior, accessibility, optimistic updates where the existing
codebase already does this for the resource type) → acceptance criteria →
testing notes. A step is done when a user can actually use that slice
end-to-end, not when the backend compiles.

## Version roadmap

| Version | Folder | Theme | Steps |
|---|---|---|---|
| v1 | [`v1-mvp-core/`](./v1-mvp-core/) | A community can exist and be minimally useful | 4 |
| v2 | [`v2-management-permissions/`](./v2-management-permissions/) | Real roles, real invites, discovery, first leaderboard | 5 |
| v3 | [`v3-engagement-insight/`](./v3-engagement-insight/) | Badges, streaks, analytics, activity feed | 5 |
| v4 | [`v4-social-collaboration/`](./v4-social-collaboration/) | Forums, resources, calendar, mentorship, challenges, nesting, templates, moderation | 7 |

Each version folder has its own `README.md` with exact scope-in / scope-out
and the step file list. Read the version README before any step file inside
it — the step files assume that context and don't repeat it.

## Locked cross-version design decisions

These are decided once, here, so all four versions stay consistent. Do not
re-decide these inside a step file — extend them if a later version needs
more, but don't rename or restructure what earlier versions already shipped.

### Schema (table names, introduced by version)

- **v1**: `community`, `community_member`, `community_tracked_category`,
  `community_category_mapping`, `community_invite_code`
- **v2**: extends `community_member.role` (adds `manager`), adds
  `community_invite` (supersedes the v1 invite-code as the general case),
  adds denormalized `community.member_count` for discovery sort
- **v3**: adds `community_badge`, `community_member_badge`,
  `community_member_streak`, `community_activity_event`
- **v4**: adds `community_forum_thread`, `community_forum_reply`,
  `community_resource`, `community_calendar_event`,
  `community_mentorship_pair`, `community_challenge`,
  `community_challenge_participant`, `community_kudos`,
  `community.parent_community_id` (self-referencing, nullable),
  `community_template`, `community_flag`

Full DDL for each table lives in the step file that introduces it — this
list exists so a later step never accidentally reinvents a table under a
different name.

### The category/tag mapping decision (the one real design risk)

Categories and tags are per-user today (`category.created_by`,
`tag.created_by` both reference a single user, per migrations `0007` and
`0009` which *removed* global uniqueness). Two ways to let a community track
"the same" category across members:

1. Make categories shareable/community-scoped — touches the existing
   per-user category model everywhere it's used (sessions, statistics,
   tags' `allowed_categories`).
2. Keep personal categories exactly as they are. A community defines its own
   `community_tracked_category` rows (just a name + color, owned by the
   community). Each member independently maps one or more of *their own*
   personal categories to a tracked category via
   `community_category_mapping`. Aggregation joins
   `session.category_id = community_category_mapping.personal_category_id`.

**Decision: option 2.** Zero changes to the existing category/tag/session
models, per-user data ownership is untouched, and a member can map an
oddly-named personal category ("CS101 grind") to a community's tracked
category ("Algorithms") without renaming anything. The cost is an explicit
one-time mapping step for each member when they join, which v1's UI must
make close to zero-friction (suggest-a-match by name similarity is a nice-to
-have, not required for v1).

### Conventions every step must follow (already established in the codebase)

- **User id is `String`**, not `Uuid` (`backend/src/entity/user.rs`) — every
  new FK to `user(id)` is `TEXT REFERENCES "user"(id)`.
- **Auth**: handlers take an `actor: Actor` extractor
  (`backend/src/router/clerk.rs`) and pass `&actor` into service calls; there
  is no separate authorization middleware layer today, checks happen in the
  service layer (see `friend_service.rs` for the pattern).
- **Router pattern**: one dir per resource under `backend/src/router/`, a
  `root.rs` exporting a `Router<AppState>` builder function
  (`community_router()`), nested in `backend/src/router/root.rs` under
  `/api/community`. New sub-resources within community (invites, badges,
  ...) get their own file inside `router/community/` and are merged into the
  same `community_router()`, following how `session/` splits into
  `fixed.rs`/`stopwatch.rs`/`template.rs`.
- **Service holds business logic and permission checks**, repository is
  thin/query-only. `AppState` gets one new `*_service` field per resource
  (`community_service`, later `community_invite_service` etc. if a
  sub-resource earns its own service).
- **Migrations**: sequential, zero-padded, `backend/migrations/NNNN_verb.sql`.
  The latest migration at plan time is `0056`, so v1's schema step starts at
  `0057`. Each later version's step files continue numbering from wherever
  the previous version's plan left off — the exact number matters less than
  never reusing one; check `ls backend/migrations | sort -V | tail -1`
  before cutting the real migration.
- **Frontend layering**: `api/definitions/{models,requests,responses}/<resource>.ts`
  (Zod schemas) → `api/<resource>Api.ts` (raw calls via `baseApi`,
  `parseResponseUnsafe`) → `components/hooks/<resource>/use<Verb><Resource>.ts(x)`
  (React Query, cache keys from the central `queryKeys` factory in
  `components/hooks/queryHooks/queryKeys.ts`) → components. Mutations
  invalidate the relevant `queryKeys` entry and show a toast
  (`useToast` from `components/shadcn/use-toast`); use optimistic updates
  where the mutation affects something the user is staring at (the codebase
  already does this for starting a session — match that pattern for things
  like join/leave and leaderboard position).
- **Components**: `const Component: FC<Props> = (props) => {}`, PascalCase
  filenames, absolute imports (`@/...`), `type` over `interface`.

### "Fully polished" means, concretely, for every step

- A skeleton loading state, not a spinner-only placeholder.
- A designed empty state (not just "No data") for the first-run case —
  e.g. a community with no members yet, no tracked categories yet, no
  leaderboard data yet.
- Inline validation errors on forms (Zod-driven) plus a toast for
  server-side failures, matching existing form patterns.
- Optimistic UI for actions the user expects to feel instant (join/leave,
  sending kudos, reacting) with rollback on failure.
- Responsive down to mobile width — community dashboard, leaderboard, and
  member lists in particular need a real mobile layout, not a squeezed
  desktop table.
- Keyboard navigation and ARIA labeling on anything interactive (role
  dropdowns, invite forms, badge grids), and color choices (leaderboard
  rank, streak indicators, badge rarity) that hold up under
  `prefers-color-scheme: dark` and don't rely on color alone to convey
  meaning.

## How to use this plan

Work through steps in order within a version, and versions in order — later
steps assume earlier tables/services/components exist. Each step file is
self-contained enough to hand to an implementer (human or agent) without
needing this README open, except for the conventions above, which are
assumed knowledge for every step.
