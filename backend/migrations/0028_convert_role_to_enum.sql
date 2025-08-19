-- Create the enum type for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Update existing NULL role values to 'user' before converting
UPDATE "user" SET role = 'user' WHERE role IS NULL;

-- Add a temporary column with the new enum type
ALTER TABLE "user" ADD COLUMN role_new user_role;

-- Migrate existing data to the new column
UPDATE "user" SET role_new =
    CASE
        WHEN role = 'admin' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END;

-- Drop the old column and rename the new one
ALTER TABLE "user" DROP COLUMN role;
ALTER TABLE "user" RENAME COLUMN role_new TO role;

-- Make the column NOT NULL with default value
ALTER TABLE "user" ALTER COLUMN role SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN role SET DEFAULT 'user'::user_role;

-- Drop the old index and create a new one
DROP INDEX IF EXISTS idx_user_role;
CREATE INDEX idx_user_role ON "user"(role);