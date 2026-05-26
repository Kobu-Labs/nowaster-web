CREATE TYPE avatar_tier AS ENUM ('free', 'paid');

CREATE TYPE generation_status AS ENUM ('pending', 'running', 'success', 'failed');

CREATE TABLE hint (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL UNIQUE,
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE avatar_preset (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    reference_image_url TEXT NOT NULL,
    is_active BOOL NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_avatar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL UNIQUE REFERENCES "user"(id),
    base_preset_id UUID REFERENCES avatar_preset(id),
    current_image_url TEXT,
    current_thumb_url TEXT,
    tier avatar_tier NOT NULL DEFAULT 'free',
    is_enabled BOOL NOT NULL DEFAULT FALSE,
    last_generated_at TIMESTAMPTZ,
    next_generation_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE generation_run (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES "user"(id),
    status generation_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    input_data TEXT,
    image_url TEXT,
    thumb_url TEXT,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_avatar_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES "user"(id),
    image_url TEXT NOT NULL,
    thumb_url TEXT NOT NULL,
    generation_run_id UUID NOT NULL REFERENCES generation_run(id),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE category_hint (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES category(id),
    user_id VARCHAR NOT NULL REFERENCES "user"(id),
    hint_id UUID NOT NULL REFERENCES hint(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (category_id, user_id, hint_id)
);
