-- Add email column to users table for OAuth
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);

-- Note: id column remains VARCHAR to support both Clerk IDs and UUID strings
-- New OAuth users will have UUID-formatted strings as IDs
