-- Convert backup_size_gb to backup_size_bytes
-- This migration changes the column from storing GB (NUMERIC) to storing bytes (BIGINT)

-- Add new column for bytes
ALTER TABLE db_backups ADD COLUMN backup_size_bytes BIGINT;

-- Convert existing GB values to bytes (1 GB = 1024^3 bytes = 1073741824 bytes)
UPDATE db_backups
SET backup_size_bytes = FLOOR(backup_size_gb * 1073741824)::BIGINT
WHERE backup_size_gb IS NOT NULL;

-- Drop old column
ALTER TABLE db_backups DROP COLUMN backup_size_gb;
