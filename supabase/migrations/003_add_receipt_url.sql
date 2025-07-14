-- Add receipt_url column to orders table for storing uploaded receipt files
ALTER TABLE orders
ADD COLUMN receipt_url TEXT;

-- Add index for performance when filtering orders with receipts
CREATE INDEX idx_orders_receipt_url ON orders(receipt_url) WHERE receipt_url IS NOT NULL;