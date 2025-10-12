CREATE TABLE impersonation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id VARCHAR NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    target_user_id VARCHAR NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_impersonation_sessions_admin ON impersonation_sessions(admin_user_id);
CREATE INDEX idx_impersonation_sessions_target ON impersonation_sessions(target_user_id);
CREATE INDEX idx_impersonation_sessions_token_hash ON impersonation_sessions(token_hash);
