-- Sandbox lifecycle tracking table
-- Tracks each sandbox environment instance from creation to teardown

CREATE TABLE sandbox_lifecycle (
    id SERIAL PRIMARY KEY,

    -- Lifecycle status
    status TEXT NOT NULL DEFAULT 'active', -- active, failed, recycled

    -- Who created/torndown the sandbox
    created_by TEXT NOT NULL,
    created_type TEXT NOT NULL, -- system, user
    torndown_by TEXT,
    torndown_type TEXT, -- automatic, manual

    -- Metrics
    unique_users INTEGER NOT NULL DEFAULT 0,
    total_session_hours NUMERIC(10, 2),

    -- Timing
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for querying
CREATE INDEX idx_sandbox_lifecycle_status ON sandbox_lifecycle(status);
CREATE INDEX idx_sandbox_lifecycle_started_at ON sandbox_lifecycle(started_at DESC);
