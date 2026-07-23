-- Declared in ascending permission order (member < owner) so that both
-- `ORDER BY role DESC` (used below to put the owner first in member lists)
-- and any future `role >= X` comparison behave correctly. v2 inserts
-- 'manager' between them with `ALTER TYPE ... ADD VALUE 'manager' AFTER
-- 'member'`, relying on this ordering — keep it if this line ever changes.
CREATE TYPE community_member_role AS ENUM ('member', 'owner');

CREATE TABLE IF NOT EXISTS "community_member" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    role community_member_role NOT NULL DEFAULT 'member',

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_member_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT fk_community_member_user
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT uq_community_member UNIQUE (community_id, user_id)
);

CREATE INDEX idx_community_member_community_id ON "community_member"(community_id);
CREATE INDEX idx_community_member_user_id ON "community_member"(user_id);

CREATE TABLE IF NOT EXISTS "community_invite_code" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL UNIQUE,
    code VARCHAR(12) NOT NULL UNIQUE,
    created_by TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_invite_code_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT fk_community_invite_code_created_by
        FOREIGN KEY (created_by) REFERENCES "user"(id)
);

CREATE INDEX idx_community_invite_code_code ON "community_invite_code"(code);

-- Backfill: every existing community (created before this migration ran)
-- gets an owner membership row so the widened "list communities I'm a
-- member of" query doesn't silently drop communities created before this.
INSERT INTO "community_member" (community_id, user_id, role)
SELECT id, owner_id, 'owner'
FROM "community"
ON CONFLICT (community_id, user_id) DO NOTHING;
