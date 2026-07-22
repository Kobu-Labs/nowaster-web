ALTER TABLE generation_run
    DROP COLUMN input_data;

ALTER TABLE generation_run
    ADD COLUMN input_data JSONB;
