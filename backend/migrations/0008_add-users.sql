CREATE TABLE IF NOT EXISTS "user" (
    id VARCHAR PRIMARY KEY,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    displayname VARCHAR NOT NULL
);

ALTER TABLE session
ADD COLUMN user_id VARCHAR,
ADD CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE category
ADD COLUMN created_by VARCHAR,
ADD CONSTRAINT fk_category_user FOREIGN KEY (created_by) REFERENCES "user"(id);

ALTER TABLE tag
ADD COLUMN created_by VARCHAR,
ADD CONSTRAINT fk_tag_user FOREIGN KEY (created_by) REFERENCES "user"(id);

DROP TABLE IF EXISTS "user";
