CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE category (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP DEFAULT NOW(),

    "name" TEXT NOT NULL UNIQUE
);


CREATE TABLE tag (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP DEFAULT NOW(),

    "label" TEXT NOT NULL UNIQUE
);


CREATE TABLE users (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP DEFAULT NOW(),

    "display_name" TEXT NOT NULL
);

CREATE TABLE session (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    "type" TEXT NOT NULL,

    "start_time" TIMESTAMP NOT NULL,
    "end_time" TIMESTAMP,
    "description" TEXT,

    "created_at" TIMESTAMP DEFAULT NOW(),

    CONSTRAINT "fk_user_table"
    FOREIGN KEY ("user_id") REFERENCES users("id"),

    CONSTRAINT "fk_category_table"
    FOREIGN KEY ("category_id") REFERENCES category("id")
);




CREATE TABLE tag_to_session (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP DEFAULT NOW(),

    "tag_id" UUID,
    "session_id" UUID,

    CONSTRAINT "fk_tag_table"
    FOREIGN KEY ("tag_id") REFERENCES tag("id"),
    CONSTRAINT "fk_session_table"
    FOREIGN KEY ("session_id") REFERENCES session("id")
);

