-- Add unique constraint to prevent duplicate tag-session pairs
ALTER TABLE tag_to_session 
ADD CONSTRAINT unique_tag_session 
UNIQUE (tag_id, session_id);