-- Add task_completed and project_completed to feed_event_type enum
ALTER TYPE feed_event_type ADD VALUE IF NOT EXISTS 'task_completed';
ALTER TYPE feed_event_type ADD VALUE IF NOT EXISTS 'project_completed';
