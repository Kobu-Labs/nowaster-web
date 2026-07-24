CREATE TYPE community_invite_type AS ENUM ('direct', 'link');
CREATE TYPE community_invite_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'revoked',
    'expired'
);

CREATE TABLE community_invite (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL REFERENCES community(id) ON DELETE CASCADE,
    invite_type community_invite_type NOT NULL,
    status community_invite_status NOT NULL DEFAULT 'pending',

    -- direct invites only
    invited_user_id TEXT REFERENCES "user"(id),

    -- link invites only
    code VARCHAR UNIQUE,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,

    created_by TEXT NOT NULL REFERENCES "user"(id),
    expires_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT community_invite_shape_check CHECK (
        (invite_type = 'direct' AND invited_user_id IS NOT NULL AND code IS NULL)
        OR
        (invite_type = 'link' AND code IS NOT NULL AND invited_user_id IS NULL)
    )
);

CREATE INDEX idx_community_invite_community_status
    ON community_invite(community_id, status);
CREATE INDEX idx_community_invite_invited_user_status
    ON community_invite(invited_user_id, status)
    WHERE invite_type = 'direct';
CREATE UNIQUE INDEX idx_community_invite_code
    ON community_invite(code)
    WHERE code IS NOT NULL;

-- Prevent duplicate pending direct invites to the same user for the same
-- community.
CREATE UNIQUE INDEX idx_community_invite_unique_pending_direct
    ON community_invite(community_id, invited_user_id)
    WHERE invite_type = 'direct' AND status = 'pending';

-- Migrate v1's single static code into the new table as a never-expiring,
-- unlimited-use link invite, then retire the old table.
INSERT INTO community_invite (
    community_id, invite_type, status, code, created_by, expires_at, max_uses
)
SELECT
    cic.community_id,
    'link',
    'pending',
    cic.code,
    cic.created_by,
    NULL,
    NULL
FROM community_invite_code cic;

DROP TABLE community_invite_code;

-- New notification types for direct community invites, following the
-- ALTER TYPE ... ADD VALUE pattern already used for notification_type.
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:invite_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'community:invite_accepted';
