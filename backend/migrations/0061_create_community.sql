CREATE TYPE community_visibility_type AS ENUM ('public', 'invite_only');
CREATE TYPE community_data_visibility AS ENUM ('public', 'members_only');

CREATE TABLE IF NOT EXISTS "community" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,

    visibility_type community_visibility_type NOT NULL DEFAULT 'invite_only',
    data_visibility community_data_visibility NOT NULL DEFAULT 'members_only',

    owner_id TEXT NOT NULL,

    archived_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_owner
        FOREIGN KEY (owner_id) REFERENCES "user"(id),
    CONSTRAINT community_name_length
        CHECK (char_length(name) BETWEEN 1 AND 80),
    CONSTRAINT community_description_length
        CHECK (description IS NULL OR char_length(description) <= 2000)
);

CREATE INDEX idx_community_owner_id ON "community"(owner_id);
-- Speeds up "browse public communities" style queries; only cheap now, pays
-- off directly when v2 adds discovery.
CREATE INDEX idx_community_visibility_type ON "community"(visibility_type)
    WHERE archived_at IS NULL;
