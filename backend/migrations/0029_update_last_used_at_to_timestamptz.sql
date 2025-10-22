-- Update last_used_at columns in tag and category tables to use timestamptz with NOT NULL and default now()

UPDATE tag SET last_used_at = NOW() WHERE last_used_at IS NULL;
UPDATE category SET last_used_at = NOW() WHERE last_used_at IS NULL;

ALTER TABLE tag
    ALTER COLUMN last_used_at TYPE TIMESTAMPTZ USING last_used_at AT TIME ZONE 'UTC',
    ALTER COLUMN last_used_at SET NOT NULL,
    ALTER COLUMN last_used_at SET DEFAULT NOW();

ALTER TABLE category
    ALTER COLUMN last_used_at TYPE TIMESTAMPTZ USING last_used_at AT TIME ZONE 'UTC',
    ALTER COLUMN last_used_at SET NOT NULL,
    ALTER COLUMN last_used_at SET DEFAULT NOW();
