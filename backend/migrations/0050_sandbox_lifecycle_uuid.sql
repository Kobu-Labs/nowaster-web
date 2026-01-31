ALTER TABLE sandbox_lifecycle DROP CONSTRAINT sandbox_lifecycle_pkey;
ALTER TABLE sandbox_lifecycle DROP COLUMN id;
ALTER TABLE sandbox_lifecycle ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
