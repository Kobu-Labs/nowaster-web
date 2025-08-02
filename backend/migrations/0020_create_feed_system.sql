CREATE TYPE feed_event_type AS ENUM ('session_completed', 'session_started');

CREATE TABLE IF NOT EXISTS "feed_event" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- id of the user that created the event
    user_id VARCHAR NOT NULL,
    event_type feed_event_type NOT NULL,
    
    -- JSON data for different event types
    event_data JSONB NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "feed_reaction" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    feed_event_id UUID NOT NULL,
    user_id VARCHAR NOT NULL,
    
    emoji VARCHAR(10) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (feed_event_id) REFERENCES "feed_event"(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    
    UNIQUE(feed_event_id, user_id, emoji)
);

CREATE INDEX idx_feed_event_created_at ON feed_event(created_at DESC);
CREATE INDEX idx_feed_event_user_id ON feed_event(user_id);
CREATE INDEX idx_feed_reaction_event_id ON feed_reaction(feed_event_id);
