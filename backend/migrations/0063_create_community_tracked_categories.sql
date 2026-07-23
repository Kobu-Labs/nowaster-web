CREATE TABLE IF NOT EXISTS "community_tracked_category" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_community_tracked_category_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT uq_community_tracked_category_name
        UNIQUE (community_id, name),
    CONSTRAINT community_tracked_category_name_length
        CHECK (char_length(name) BETWEEN 1 AND 60)
);

CREATE INDEX idx_community_tracked_category_community_id
    ON "community_tracked_category"(community_id);

CREATE TABLE IF NOT EXISTS "community_category_mapping" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    community_id UUID NOT NULL,
    tracked_category_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    personal_category_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ccm_community
        FOREIGN KEY (community_id) REFERENCES "community"(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccm_tracked_category
        FOREIGN KEY (tracked_category_id) REFERENCES "community_tracked_category"(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccm_user
        FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT fk_ccm_personal_category
        FOREIGN KEY (personal_category_id) REFERENCES "category"(id) ON DELETE CASCADE,
    CONSTRAINT uq_ccm_no_duplicate_mapping
        UNIQUE (tracked_category_id, user_id, personal_category_id)
);

CREATE INDEX idx_ccm_community_user ON "community_category_mapping"(community_id, user_id);
CREATE INDEX idx_ccm_personal_category ON "community_category_mapping"(personal_category_id);
CREATE INDEX idx_ccm_tracked_category ON "community_category_mapping"(tracked_category_id);
