-- Prevents two concurrent (pending/running) generation runs for the same user,
-- closing the TOCTOU race where two near-simultaneous trigger_generation calls
-- could both pass the "not already running" application-level check.
CREATE UNIQUE INDEX generation_run_one_active_per_user
    ON generation_run (user_id)
    WHERE status IN ('pending', 'running');
