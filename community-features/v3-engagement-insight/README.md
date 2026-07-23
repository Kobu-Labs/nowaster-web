# v3 — Engagement & Insight Depth

## Goal

v2 made communities manageable and mildly competitive (leaderboard). v3 adds
the reasons to keep coming back: recognition (badges), momentum (streaks),
and understanding (analytics, activity feed).

## In scope

- Achievement badges: a **fixed, system-defined** set (not custom
  per-community badges yet — e.g. "First 10 Hours", "7-Day Streak",
  "Category Mastery: 50h in one tracked category"), awarded automatically,
  shown on member profile within the community
- Streaks: consecutive days with a tracked session in the community,
  current + longest, per member
- Analytics dashboard: time distribution across tracked categories, trending
  categories over a period, both as charts
- Activity heatmap: when the community is most active (day-of-week ×
  hour-of-day)
- Progress comparison: a member's time vs. the anonymous community average,
  never showing another individual member's number without their consent
  (respects `data_visibility`)
- Activity feed: joins, badge awards, streak milestones — system-generated
  events only, no user-authored posts yet (that's forums, v4)

## Explicitly out of scope (later versions)

- Custom/community-defined badges (→ v4 if ever; not currently planned,
  revisit after v3 ships)
- Forums, resources, calendar, mentorship matching, team challenges, peer
  kudos, nested communities, templates, automated moderation, analytics
  export (→ v4)

## Depends on (from v1/v2)

- Aggregation query from v1 step 4, extended rather than replaced.
- `community_member` and roles from v1/v2 (badges and streaks attach to a
  `community_member`, not a bare user, since they're scoped to one
  community's membership).
- Leaderboard period-selector UI pattern from v2 step 4 — the analytics
  dashboard reuses the same period control for consistency.

## Steps

1. [`01-achievement-badges.md`](./01-achievement-badges.md) — badge
   definitions, award-evaluation logic, badge display UI + notification on
   award.
2. [`02-streaks.md`](./02-streaks.md) — streak computation, UI streak
   indicator.
3. [`03-analytics-distribution-and-trends.md`](./03-analytics-distribution-and-trends.md)
   — time distribution + trending categories charts.
4. [`04-activity-heatmap-and-progress-comparison.md`](./04-activity-heatmap-and-progress-comparison.md)
   — heatmap + anonymous average comparison.
5. [`05-community-activity-feed.md`](./05-community-activity-feed.md) —
   system-event feed, consumes events emitted by steps 1–2.

Build 1–2 before 5 (the feed needs badge/streak events to show anything).
Steps 3–4 are independent of 1–2 and can be built in parallel with them.
