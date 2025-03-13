ALTER TABLE category
ADD CONSTRAINT unique_category_name_per_user
UNIQUE (name, created_by);

