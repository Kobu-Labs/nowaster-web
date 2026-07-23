# v1 — MVP Core

## Goal

A community can exist, people can join it, members can connect their own
categories to what the community tracks, and everyone can see an honest
aggregate of the group's time. That's the whole version. It should feel
finished for that narrow scope, not like a stub.

## In scope

- Create/edit/archive a community: name, description, avatar, visibility
  type (`public` / `invite_only`), data visibility (`public` / `members_only`)
- Join a public community directly; join an invite-only one via a single
  shareable invite code (no expiry, no per-user invites yet)
- Leave a community
- Two roles only: `owner` (the creator, exactly one, cannot leave without
  transferring or deleting) and `member`
- A community defines "tracked categories" (its own named buckets, not
  reused from any user's personal categories)
- Each member maps one or more of *their own* personal categories to one or
  more of the community's tracked categories
- A dashboard: total community time, per-tracked-category breakdown, a
  member list with each member's contribution, respecting `data_visibility`
- Aggregation computed at query time (no denormalization/caching yet — v1 is
  correctness and UX, not scale)

## Explicitly out of scope (later versions)

- Manager role / any granular permissions beyond owner-vs-member (→ v2)
- Direct/expiring invites, invite accept-decline inbox (→ v2, v1 only has
  the single static invite code)
- Public community discovery/search/browse (→ v2)
- Leaderboards, badges, streaks, any gamification (→ v2/v3)
- Activity feed, analytics charts/heatmaps, progress comparison (→ v3)
- Forums, resources, calendar, mentorship, challenges, kudos, nested
  communities, templates, moderation tooling, analytics export (→ v4)

## Steps

1. [`01-database-schema-and-community-crud.md`](./01-database-schema-and-community-crud.md)
   — migrations, entities, and community create/read/update/archive,
   end-to-end including the create/edit UI.
2. [`02-membership-join-leave-invite-code.md`](./02-membership-join-leave-invite-code.md)
   — membership table, join/leave, static invite code, member list UI.
3. [`03-category-tag-mapping.md`](./03-category-tag-mapping.md)
   — tracked categories + per-member mapping, end-to-end including the
   mapping UI a new member sees.
4. [`04-aggregation-and-dashboard.md`](./04-aggregation-and-dashboard.md)
   — the aggregation query/service and the community dashboard UI that
   consumes it, including `data_visibility` enforcement.

Build in this order — each step's UI depends on the previous step's data
existing (you can't build a dashboard before there's a mapping to aggregate
over).
