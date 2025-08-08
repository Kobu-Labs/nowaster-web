-- Add precomputed visibility permission column to feed_subscription
ALTER TABLE feed_subscription
ADD COLUMN is_allowed_by_visibility BOOLEAN NOT NULL DEFAULT true;

-- Add index for better query performance
CREATE INDEX idx_feed_subscription_visibility ON feed_subscription(is_allowed_by_visibility);

-- Update existing subscriptions based on current visibility settings
-- This will be handled by application logic after deployment
-- For now, default to true (allowed) to maintain current behavior