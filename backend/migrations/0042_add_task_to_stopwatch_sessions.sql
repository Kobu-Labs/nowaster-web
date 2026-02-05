-- Add optional task_id to stopwatch_session table for task-based time tracking
ALTER TABLE stopwatch_session
ADD COLUMN task_id UUID,
ADD CONSTRAINT fk_stopwatch_session_task FOREIGN KEY (task_id) REFERENCES "task"(id) ON DELETE SET NULL;

-- Index for filtering stopwatch sessions by task
CREATE INDEX idx_stopwatch_session_task_id ON stopwatch_session(task_id);
