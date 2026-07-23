# v2 — Management & Permissions Depth

## Goal

v1 proved the core loop works with just owner/member and a single static
invite code. v2 makes communities manageable at real size: proper roles,
proper invites, the ability to actually find a public community instead of
being handed a link, and the first taste of competition.

## In scope

- `manager` role added between `owner` and `member`: can manage tracked
  categories, invite/remove members, cannot delete the community or change
  ownership
- Real invite system: invite a specific user by username (they get a
  notification, can accept/decline), generate shareable links with an
  expiry, revoke pending invites — supersedes v1's single static code
  (the v1 code becomes one row in the new invite table, not a separate
  system)
- Public community discovery: browse/search by name/category, sorted by
  activity or member count
- A basic leaderboard: ranked member list by tracked time, period selector
  (day/week/month/all-time), no badges or streaks attached to it yet
- Bulk operations: invite multiple users at once, bulk-assign a tracked
  category mapping suggestion to multiple members (e.g. "these 30 students
  are probably all in the same course")

## Explicitly out of scope (later versions)

- Achievement badges, streaks (→ v3)
- Analytics charts, heatmaps, progress comparison, activity feed (→ v3)
- Forums, resources, calendar, mentorship, challenges, kudos, nesting,
  templates, automated moderation, analytics export (→ v4)

## Depends on (from v1)

- `community`, `community_member` (role column gets a new enum value here,
  not a new column), `community_tracked_category`,
  `community_category_mapping`, `community_invite_code` (read once, then
  superseded), and the v1 dashboard/aggregation query.

## Steps

1. [`01-roles-and-permissions.md`](./01-roles-and-permissions.md) —
   `manager` role, permission checks in the service layer, member
   management UI (role badges, promote/demote/remove).
2. [`02-invite-system.md`](./02-invite-system.md) — `community_invite`
   table, direct invite + expiring links, accept/decline inbox, migrating
   off the v1 static code.
3. [`03-community-discovery.md`](./03-community-discovery.md) — search/browse
   API and UI for public communities.
4. [`04-leaderboard.md`](./04-leaderboard.md) — ranked aggregation by
   period, leaderboard UI.
5. [`05-bulk-operations.md`](./05-bulk-operations.md) — bulk invite and bulk
   category-mapping-suggestion UI/API.

Steps 1–2 should land before 3–5; discovery, leaderboards, and bulk ops all
assume a real role/invite system exists (e.g. bulk invite needs the invite
table from step 2).
