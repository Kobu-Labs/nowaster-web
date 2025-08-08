-- Create user visibility enum
CREATE TYPE user_visibility AS ENUM (
    'private',          -- Sessions not visible to anyone in feeds
    'public',           -- Sessions visible to all users
    'friends_only',     -- Sessions visible only to friends
    'groups_only'       -- Sessions visible only to group members
);

-- Add visibility column to user table with default 'public'
ALTER TABLE "user"
ADD COLUMN visibility user_visibility NOT NULL DEFAULT 'public';

-- Add index for better query performance
CREATE INDEX idx_user_visibility ON "user"(visibility);