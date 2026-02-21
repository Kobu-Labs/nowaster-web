CREATE TABLE metrics_handler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code SMALLINT NOT NULL,
    duration_ms FLOAT8 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE metrics_db_query (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID,
    query_name TEXT NOT NULL,
    duration_ms FLOAT8 NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
