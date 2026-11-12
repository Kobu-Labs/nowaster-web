-- Per-user block list used by the browser extension
CREATE TABLE IF NOT EXISTS "block_rule" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    -- Domain (youtube.com) or domain with path (example.com/path); stored trimmed and lowercase
    pattern VARCHAR NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_block_rule_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT uq_block_rule_user_pattern UNIQUE (user_id, pattern)
);

CREATE INDEX idx_block_rule_user_id ON block_rule(user_id);
