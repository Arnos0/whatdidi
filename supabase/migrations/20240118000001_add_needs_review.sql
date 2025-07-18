-- Add needs_review column to orders table for MVP
-- This column is used to flag orders that need manual review due to low confidence parsing

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT false;

-- Add index for performance when filtering orders that need review
CREATE INDEX IF NOT EXISTS idx_orders_needs_review 
ON orders(needs_review) 
WHERE needs_review = true;

-- Add composite index for user's orders that need review
CREATE INDEX IF NOT EXISTS idx_orders_user_needs_review 
ON orders(user_id, needs_review) 
WHERE needs_review = true;

-- Add comment for documentation
COMMENT ON COLUMN orders.needs_review IS 'Flag indicating if order needs manual review due to low confidence parsing (<0.7) or other issues';