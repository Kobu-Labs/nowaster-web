-- Release table to store all release information
CREATE TABLE IF NOT EXISTS "release" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Version identifier (corresponds to GitHub tag, e.g., "v1.1.1")
    version VARCHAR(50) NOT NULL UNIQUE,

    -- Release metadata
    name VARCHAR(255) NOT NULL,
    short_description TEXT,

    -- Release status
    released BOOLEAN NOT NULL DEFAULT FALSE,
    released_at TIMESTAMPTZ,
    released_by VARCHAR,

    -- Tags for categorization (stored as JSONB array)
    tags JSONB NOT NULL DEFAULT '[]',

    -- SEO metadata
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraint for released_by
    CONSTRAINT fk_release_released_by FOREIGN KEY (released_by) REFERENCES "user"(id)
);

-- Indexes for performance
CREATE INDEX idx_release_version ON release(version);
CREATE INDEX idx_release_released ON release(released);
CREATE INDEX idx_release_released_at ON release(released_at DESC);
CREATE INDEX idx_release_created_at ON release(created_at DESC);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_release_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_release_updated_at
    BEFORE UPDATE ON release
    FOR EACH ROW
    EXECUTE FUNCTION update_release_updated_at();
