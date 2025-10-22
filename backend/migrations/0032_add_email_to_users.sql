-- Add email column to users table
ALTER TABLE "user" ADD COLUMN email VARCHAR(255) UNIQUE;

-- Create index on email
CREATE INDEX idx_user_email ON "user"(email);
