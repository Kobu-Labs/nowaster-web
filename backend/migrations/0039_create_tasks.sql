-- Task table to store tasks within projects
CREATE TABLE IF NOT EXISTS "task" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Task belongs to one project
    project_id UUID NOT NULL,

    -- Task information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,

    -- User ownership
    user_id VARCHAR NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraints
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES "project"(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_task_user_id ON task(user_id);
CREATE INDEX idx_task_project_id ON task(project_id);
CREATE INDEX idx_task_completed ON task(completed);
CREATE INDEX idx_task_updated_at ON task(updated_at DESC);
CREATE INDEX idx_task_project_completed ON task(project_id, completed, updated_at DESC);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_task_updated_at
    BEFORE UPDATE ON task
    FOR EACH ROW
    EXECUTE FUNCTION update_task_updated_at();
