-- Create OAuth provider enum
CREATE TYPE oauth_provider AS ENUM ('google', 'github', 'discord');

-- Create oauth_accounts table
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

    -- OAuth provider information
    provider oauth_provider NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255),

    -- OAuth tokens (optional, for future API access to provider)
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Ensure one account per provider per user
    UNIQUE(provider, provider_user_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_oauth_accounts_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_oauth_accounts_provider_email ON oauth_accounts(provider, provider_email);
