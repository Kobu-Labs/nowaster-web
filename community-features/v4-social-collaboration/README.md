# v4 — Social, Collaboration & Polish

## Goal

Everything that turns a community from "a shared time-tracking dashboard"
into a place people actually hang out and organize around: conversation,
shared resources, coordination, mentorship, competition with a social layer,
and the structural features (nesting, templates) that make communities
reusable at scale (e.g. a university rolling out one structure per
department).

## In scope

- Discussion forums: category-scoped or general threads with replies
- Resource sharing: links/documents attached to a community or a specific
  tracked category
- Community calendar: shared events/deadlines
- Mentorship matching: opt-in pairing between experienced and new members
  within a community
- Team challenges: time-based competitions between members or sub-groups,
  with a defined window and a winner condition
- Peer kudos: lightweight recognition members give each other (distinct
  from system-awarded badges)
- Nested communities: sub-communities via `parent_community_id`
  (e.g. departments within a faculty)
- Community templates: package a community's structure (tracked categories,
  settings) as a reusable template; "copy this community's structure" flow
- Automated moderation: flag suspicious time entries (e.g. implausible
  durations) for owner/manager review
- Analytics export: CSV/JSON export of community aggregate data

## Explicitly out of scope

- Nothing left in the original planning doc after this version — anything
  proposed after v4 ships is a genuinely new idea, not a deferred one.

## Depends on (from v1/v2/v3)

- Roles (v2) gate forum moderation, challenge creation, and template
  publishing to `manager`/`owner`.
- Activity feed (v3) is the natural place kudos, challenge results, and
  new forum threads surface.
- Tracked categories (v1) are what resources and challenges attach to.

## Steps

1. [`01-discussion-forums.md`](./01-discussion-forums.md)
2. [`02-resource-sharing.md`](./02-resource-sharing.md)
3. [`03-community-calendar.md`](./03-community-calendar.md)
4. [`04-mentorship-matching.md`](./04-mentorship-matching.md)
5. [`05-team-challenges-and-kudos.md`](./05-team-challenges-and-kudos.md)
6. [`06-nested-communities-and-templates.md`](./06-nested-communities-and-templates.md)
7. [`07-automated-moderation-and-analytics-export.md`](./07-automated-moderation-and-analytics-export.md)

These seven are largely independent of each other (each is its own
sub-domain) — the suggested order front-loads the features most members will
touch daily (forums, resources, calendar) before the more structural/admin
ones (nesting, templates, moderation, export). Reorder freely based on user
demand once v1–v3 are live and you have real usage signal.
