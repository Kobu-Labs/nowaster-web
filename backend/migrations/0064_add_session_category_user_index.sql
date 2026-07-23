-- Supports the community dashboard's join from community_category_mapping
-- (personal_category_id, user_id) into session (category_id, user_id).
-- Also generally useful for any future per-category, per-user query.
CREATE INDEX IF NOT EXISTS idx_session_user_id_category_id
    ON session(user_id, category_id);
