-- Convert user visibility from enum to integer bitflags
-- This migration preserves existing data by mapping enum values to equivalent bitflag values

-- Add new integer visibility column
ALTER TABLE "user"
ADD COLUMN visibility_flags INTEGER;

-- Step 2: Migrate existing data from enum to bitflags
-- Mapping based on the new VisibilityFlags system:
-- 'private' -> 0 (no permissions)
-- 'friends_only' -> 1 (friends bit only)
-- 'groups_only' -> 2 (groups bit only)
-- 'public' -> 3 (friends + groups bits, since updated system removed separate public bit)
UPDATE "user"
SET visibility_flags = CASE
    WHEN visibility = 'private' THEN 0
    WHEN visibility = 'friends_only' THEN 1
    WHEN visibility = 'groups_only' THEN 2
    WHEN visibility = 'public' THEN 3
    ELSE 3 -- Default to friends + groups for any unknown values
END;

-- Make the new column non-null with default value
ALTER TABLE "user"
ALTER COLUMN visibility_flags SET NOT NULL,
ALTER COLUMN visibility_flags SET DEFAULT 3; -- Default to friends + groups (public equivalent)

-- Create index for better query performance on the new column
CREATE INDEX idx_user_visibility_flags ON "user"(visibility_flags);

-- Remove the old enum column and its index
DROP INDEX IF EXISTS idx_user_visibility;
ALTER TABLE "user" DROP COLUMN visibility;

-- Drop the enum type (this will only work if no other tables use it)
DROP TYPE IF EXISTS user_visibility;

-- Add comment explaining the bitflag values
COMMENT ON COLUMN "user".visibility_flags IS 'Bitflag permissions: 1=friends, 2=groups, 4=public. Combine with OR operation.';
