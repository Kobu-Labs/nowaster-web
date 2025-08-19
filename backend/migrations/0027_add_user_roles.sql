ALTER TABLE "user"
ADD COLUMN role VARCHAR DEFAULT 'user' CHECK (role IN ('user', 'admin'));

CREATE INDEX idx_user_role ON "user"(role);