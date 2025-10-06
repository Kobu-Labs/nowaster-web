-- Fix timestamp columns to use TIMESTAMPTZ for oauth_accounts
ALTER TABLE oauth_accounts
    ALTER COLUMN token_expires_at TYPE TIMESTAMPTZ,
    ALTER COLUMN created_at TYPE TIMESTAMPTZ,
    ALTER COLUMN updated_at TYPE TIMESTAMPTZ;

-- Fix timestamp columns to use TIMESTAMPTZ for refresh_tokens
ALTER TABLE refresh_tokens
    ALTER COLUMN created_at TYPE TIMESTAMPTZ,
    ALTER COLUMN expires_at TYPE TIMESTAMPTZ,
    ALTER COLUMN last_used_at TYPE TIMESTAMPTZ,
    ALTER COLUMN revoked_at TYPE TIMESTAMPTZ;
