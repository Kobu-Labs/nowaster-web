ALTER TABLE tag_to_session
DROP CONSTRAINT IF EXISTS fk_session_table;

ALTER TABLE tag_to_session
ADD CONSTRAINT fk_session_table
FOREIGN KEY (session_id)
REFERENCES session(id)
ON DELETE CASCADE;

