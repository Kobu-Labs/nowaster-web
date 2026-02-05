-- Add optional task_id to session table for task-based time tracking
ALTER TABLE session
ADD COLUMN task_id UUID,
ADD CONSTRAINT fk_session_task FOREIGN KEY (task_id) REFERENCES "task"(id) ON DELETE SET NULL;

-- Index for filtering sessions by task
CREATE INDEX idx_session_task_id ON session(task_id);
