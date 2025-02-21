ALTER TABLE tag_to_session
DROP CONSTRAINT fk_tag_table;

ALTER TABLE tag_to_session
ADD CONSTRAINT fk_tag_table
FOREIGN KEY ("tag_id") REFERENCES tag("id") ON DELETE CASCADE;
