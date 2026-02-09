-- Track which releases users have seen
CREATE TABLE IF NOT EXISTS "seen_release" (
    release_id UUID NOT NULL,
    user_id VARCHAR NOT NULL,
    seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (release_id, user_id),

    FOREIGN KEY (release_id) REFERENCES "release"(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Indexes for quick lookups
CREATE INDEX idx_seen_release_user_id ON seen_release(user_id);
CREATE INDEX idx_seen_release_release_id ON seen_release(release_id);
CREATE INDEX idx_seen_release_seen_at ON seen_release(seen_at DESC);
