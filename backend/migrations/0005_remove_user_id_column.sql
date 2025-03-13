ALTER TABLE session
DROP CONSTRAINT "fk_user_table";

ALTER TABLE session
DROP COLUMN "user_id";
