ALTER TABLE tag ADD COLUMN last_used_at TIMESTAMP;
ALTER TABLE category ADD COLUMN last_used_at TIMESTAMP;

CREATE OR REPLACE FUNCTION update_category_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE category
  SET last_used_at = NOW()
  WHERE id = NEW.category_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_category_last_used
AFTER INSERT ON session
FOR EACH ROW
EXECUTE FUNCTION update_category_last_used();


CREATE TRIGGER trg_update_category_last_used_stopwatch
AFTER INSERT ON stopwatch_session
FOR EACH ROW
EXECUTE FUNCTION update_category_last_used();




CREATE OR REPLACE FUNCTION update_tag_last_used()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tag
  SET last_used_at = NOW()
  WHERE id = NEW.tag_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tag_last_used
AFTER INSERT ON tag_to_session
FOR EACH ROW
EXECUTE FUNCTION update_tag_last_used();


CREATE TRIGGER trg_update_tag_last_used_stopwatch
AFTER INSERT ON tag_to_stopwatch_session
FOR EACH ROW
EXECUTE FUNCTION update_tag_last_used();


