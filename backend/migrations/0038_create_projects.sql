-- Project table to store user projects for task organization
CREATE TABLE IF NOT EXISTS "project" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Project information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    color VARCHAR(7) NOT NULL DEFAULT '#EC4899', -- Hex color code for project theme
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    -- User ownership
    user_id VARCHAR NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_project_user_id ON project(user_id);
CREATE INDEX idx_project_completed ON project(completed);
CREATE INDEX idx_project_updated_at ON project(updated_at DESC);
CREATE INDEX idx_project_user_completed ON project(user_id, completed, updated_at DESC);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_updated_at
    BEFORE UPDATE ON project
    FOR EACH ROW
    EXECUTE FUNCTION update_project_updated_at();
