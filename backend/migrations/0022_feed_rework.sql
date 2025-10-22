CREATE TYPE feed_source_type AS ENUM ('group', 'user', 'system');

ALTER TABLE feed_event ADD COLUMN source_type feed_source_type NOT NULL;
ALTER TABLE feed_event ADD COLUMN source_id VARCHAR NOT NULL;
ALTER TABLE feed_event DROP COLUMN "user_id";

CREATE TABLE IF NOT EXISTS feed_subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    subscriber_id VARCHAR NOT NULL,
    source_type feed_source_type NOT NULL,
    source_id VARCHAR NOT NULL,

    is_muted  BOOLEAN NOT NULL DEFAULT FALSE,
    is_paused BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (subscriber_id, source_type, source_id),
    FOREIGN KEY (subscriber_id) REFERENCES "user"(id) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_feed_subscription_user
    ON feed_subscription (subscriber_id);

CREATE INDEX IF NOT EXISTS idx_feed_subscription_source
    ON feed_subscription (source_type, source_id);


DROP INDEX IF EXISTS idx_feed_event_created_at;
DROP INDEX IF EXISTS idx_feed_event_user_id;

CREATE INDEX IF NOT EXISTS idx_feed_event_source_type_id
    ON feed_event (source_type, source_id);

CREATE INDEX IF NOT EXISTS idx_feed_event_created_at
    ON feed_event (created_at DESC);
