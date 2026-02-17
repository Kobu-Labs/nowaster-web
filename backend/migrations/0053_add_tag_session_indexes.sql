CREATE INDEX idx_tag_to_session_session_id ON tag_to_session(session_id);
CREATE INDEX idx_tag_to_session_tag_id ON tag_to_session(tag_id);

CREATE INDEX idx_tag_to_stopwatch_session_session_id ON tag_to_stopwatch_session(session_id);
CREATE INDEX idx_tag_to_stopwatch_session_tag_id ON tag_to_stopwatch_session(tag_id);
