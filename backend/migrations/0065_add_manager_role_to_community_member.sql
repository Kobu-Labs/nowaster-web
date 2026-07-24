-- Postgres requires a new enum value be committed before it can be used in
-- the same session's queries, but ADD VALUE itself is safe inside the
-- single-statement transaction sqlx wraps each migration file in.
-- Storage order must stay in sync with the Rust `PartialOrd` derive on
-- `CommunityMemberRole`, which relies on declaration order `Member <
-- Manager < Owner`.
ALTER TYPE community_member_role ADD VALUE IF NOT EXISTS 'manager' AFTER 'member';
