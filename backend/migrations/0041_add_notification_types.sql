-- Add new notification types for task and project completion
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task:completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project:completed';
