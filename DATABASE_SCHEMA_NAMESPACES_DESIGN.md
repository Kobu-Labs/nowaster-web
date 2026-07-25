# Database Schema Namespaces - Design

**Status:** Design Phase — not yet implemented
**Date:** 2026-07-21

## Overview

All tables currently live in the default `public` Postgres schema. This doc
proposes splitting them into domain-scoped schemas as the app grows into
admin permissioning, paid tiers, granular permissions, and Discord-style
communities — features that would otherwise all pile into `public` alongside
the existing time-tracking tables.

**Mechanism:** Postgres schemas, not separate databases. Cross-schema
joins/FKs stay trivial, there's still one connection pool and one migration
runner, and SQLx just needs `search_path` set (or explicit `schema.table` in
queries).

**When to act:** This is not an immediate migration plan. The existing
tables work fine in `public` today. Splitting them out is worth doing when
either (a) a new domain (authz, billing, community) is actually being built,
or (b) `public` becomes genuinely hard to navigate/administer. Don't
pre-create empty schemas speculatively.

## Proposed Schemas

### `identity`
The core entity nearly everything else references.
- `user`

### `auth`
Authentication mechanics — how a user proves who they are. Kept separate
from `identity` because it's a different concern (identity vs. authn) and
separate from `authz` (authn vs. authz).
- `oauth_accounts`
- `refresh_tokens`
- `api_tokens`
- `impersonation_sessions`

### `authz` (future)
Global authorization: roles, permissions, groups used to grant site-wide
capabilities (e.g. admin). Per [AUTH_MIGRATION_DESIGN.md](./AUTH_MIGRATION_DESIGN.md),
the current model is "global roles only" with community-scoped roles
deferred — this schema is where that global model would live once it grows
past a single `role` enum column on `user`.
- `role`, `permission`, `group`, `group_membership` (not yet built)

### `billing` (future)
Paid tiers and their lifecycle. Kept separate from `authz` even though tier
gates capabilities, because billing will eventually need its own lifecycle
(renewals, payment-provider webhooks) independent of the permission model.
- `tier`, `subscription`, `entitlement` (not yet built)

### `community` (future)
Discord-server-style communities, per
[COMMUNITY_FEATURES_PLANNING.md](./COMMUNITY_FEATURES_PLANNING.md): their own
membership, channels/discussion, invites, and **per-community roles**. Kept
separate from `authz` because these roles are scoped to one community, not
global — someone can be an admin in one community and a plain member in
another, which doesn't fit the global permission model.
- `community`, `community_member`, `community_role`, `channel`, `invite`
  (not yet built)

### `social`
The personal social graph — distinct from `community`, which is about
membership in a shared space.
- `feed_event`, `feed_reaction`, `feed_subscription`
- `friend`, `friend_request`
- `notification`

### `tracking`
The core product domain: time tracking itself.
- `session`, `stopwatch_session`, `recurring_session`, `session_template`
- `category`, `tag`, `tag_category`
- `tag_to_session`, `tag_to_stopwatch_session`, `tag_to_recurring_session`
- `project`, `task`

### `avatar`
- `avatar_preset`
- `generation_run`
- `user_avatar`, `user_avatar_history`
- `hint`, `category_hint`

### `ops`
Internal/admin tooling, not user-facing product data.
- `db_backups`
- `metrics_db_query`, `metrics_handler`
- `sandbox_lifecycle`
- `release`, `seen_release`

## Open Questions

- Whether `community_role` should reuse any machinery from `authz`
  (e.g. a shared `permission` enum/bitset) even though the role assignment
  itself is scoped per-community rather than global.
- Migration mechanics for existing tables (schema-qualifying every SQLx
  query, updating `.sqlx` cache, `search_path` config) — deferred until
  this is actually being executed, not designed further here.
