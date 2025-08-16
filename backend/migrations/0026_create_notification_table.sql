CREATE TYPE notification_type AS ENUM (
    'friend:new_request',
    'friend:request_accepted',
    'session:reaction_added',
    'system:new_release'
);

CREATE TYPE notification_source_type AS ENUM (
    'user',
    'group',
    'system'
);

CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    notification_type notification_type NOT NULL,
    source_id VARCHAR NOT NULL,
    source_type notification_source_type NOT NULL,
    seen BOOLEAN NOT NULL DEFAULT FALSE,
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_user_id_seen ON notification(user_id, seen);
CREATE INDEX idx_notification_created_at ON notification(created_at DESC);
CREATE INDEX idx_notification_user_id_created_at ON notification(user_id, created_at DESC);
