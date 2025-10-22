ALTER TABLE "recurring_session" DROP CONSTRAINT fk_template_table;

ALTER TABLE "recurring_session" 
ADD CONSTRAINT fk_template_table 
FOREIGN KEY (template_id) 
REFERENCES session_template(id) 
ON DELETE CASCADE NOT DEFERRABLE;
