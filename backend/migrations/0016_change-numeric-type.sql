ALTER TABLE "recurring_session"
  ALTER COLUMN "start_minute_offset" TYPE double precision USING "start_minute_offset"::double precision,
  ALTER COLUMN "end_minute_offset" TYPE double precision USING "end_minute_offset"::double precision;
