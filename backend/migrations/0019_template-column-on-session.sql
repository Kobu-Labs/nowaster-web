ALTER TABLE session
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD CONSTRAINT fk_session_template
FOREIGN KEY (template_id)
REFERENCES session_template(id)
ON DELETE SET NULL;

