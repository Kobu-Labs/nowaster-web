-- Create refresh_tokens table for secure token storage
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- Token hash (SHA256 of the actual token)
    token_hash VARCHAR(64) NOT NULL UNIQUE,

    -- Lifecycle timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_used_at TIMESTAMP,

    -- Revocation support
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),

    -- Metadata for security tracking
    user_agent VARCHAR(512),
    ip_address INET
);

-- Indexes for efficient lookups and cleanup
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Index for finding active tokens
CREATE INDEX idx_refresh_tokens_active ON refresh_tokens(user_id, created_at)
    WHERE revoked_at IS NULL AND expires_at > NOW();
