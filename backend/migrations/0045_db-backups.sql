CREATE TABLE db_backups (
    id SERIAL PRIMARY KEY,
    
    -- Who triggered the backup
    trigger_by TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    
    -- Backup metadata
    backup_file TEXT NOT NULL,
    backup_size_gb NUMERIC(10,2),
    status TEXT NOT NULL DEFAULT 'pending',
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    finished_at TIMESTAMP WITH TIME ZONE,
    
    -- Optional: duration in seconds
    duration_seconds INT GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (finished_at - started_at))
    ) STORED
);

CREATE INDEX idx_db_backups_started_at ON db_backups (started_at DESC);
CREATE INDEX idx_db_backups_status ON db_backups (status);

