CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

CREATE TABLE IF NOT EXISTS "friend_request" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    requestor_id VARCHAR NOT NULL,
    recipient_id VARCHAR NOT NULL,

    status friend_request_status NOT NULL DEFAULT 'pending',
    introduction_message CHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_to_status friend_request_status NOT NULL DEFAULT 'pending',

    FOREIGN KEY (requestor_id) REFERENCES "user"(id),
    FOREIGN KEY (recipient_id) REFERENCES "user"(id)
);

CREATE TABLE IF NOT EXISTS "friend" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    friend_1_id VARCHAR NOT NULL,
    friend_2_id VARCHAR NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (friend_1_id) REFERENCES "user"(id),
    FOREIGN KEY (friend_2_id) REFERENCES "user"(id)
);
