ALTER TABLE community ADD COLUMN member_count INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing membership rows.
UPDATE community c
SET member_count = sub.cnt
FROM (
    SELECT community_id, COUNT(*) AS cnt
    FROM community_member
    GROUP BY community_id
) sub
WHERE c.id = sub.community_id;

CREATE OR REPLACE FUNCTION community_member_count_increment() RETURNS TRIGGER AS $$
BEGIN
    UPDATE community SET member_count = member_count + 1 WHERE id = NEW.community_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION community_member_count_decrement() RETURNS TRIGGER AS $$
BEGIN
    UPDATE community SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_community_member_count_increment
    AFTER INSERT ON community_member
    FOR EACH ROW EXECUTE FUNCTION community_member_count_increment();

CREATE TRIGGER trg_community_member_count_decrement
    AFTER DELETE ON community_member
    FOR EACH ROW EXECUTE FUNCTION community_member_count_decrement();

CREATE INDEX idx_community_discovery
    ON community(visibility_type, archived_at, member_count DESC)
    WHERE visibility_type = 'public' AND archived_at IS NULL;

-- Enables trigram-accelerated ILIKE '%query%' search on community name;
-- this is the first search surface communities has had, so enable it here
-- rather than assuming it's already available.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_community_name_search
    ON community USING gin (name gin_trgm_ops);
