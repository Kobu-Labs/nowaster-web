-- Add migration script here
CREATE TABLE tag_category (
    "tag_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    PRIMARY KEY ("tag_id", "category_id"),
    FOREIGN KEY ("tag_id") REFERENCES tag("id") ON DELETE CASCADE,
    FOREIGN KEY ("category_id") REFERENCES category("id") ON DELETE CASCADE
);
