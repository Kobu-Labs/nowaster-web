-- Add optional project_id to session tables
-- Logic:
--   - If task is assigned: both project_id and task_id are populated
--   - If only project is assigned: only project_id is populated, task_id is null
-- This allows efficient filtering by project without joining through tasks

ALTER TABLE session
ADD COLUMN project_id UUID,
ADD CONSTRAINT fk_session_project FOREIGN KEY (project_id) REFERENCES "project"(id) ON DELETE SET NULL;

ALTER TABLE stopwatch_session
ADD COLUMN project_id UUID,
ADD CONSTRAINT fk_stopwatch_session_project FOREIGN KEY (project_id) REFERENCES "project"(id) ON DELETE SET NULL;

-- Indexes for filtering sessions by project
CREATE INDEX idx_session_project_id ON session(project_id);
CREATE INDEX idx_stopwatch_session_project_id ON stopwatch_session(project_id);

-- Populate project_id for existing sessions that have task_id
UPDATE session s
SET project_id = t.project_id
FROM task t
WHERE s.task_id = t.id AND s.project_id IS NULL;

UPDATE stopwatch_session s
SET project_id = t.project_id
FROM task t
WHERE s.task_id = t.id AND s.project_id IS NULL;
