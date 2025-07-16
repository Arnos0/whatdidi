-- Add language support to orders and processed_emails tables
-- Migration: Add language columns for multilingual support

-- Add language column to orders table
ALTER TABLE orders 
ADD COLUMN language VARCHAR(2) DEFAULT 'en';

-- Add language column to processed_emails table
ALTER TABLE processed_emails
ADD COLUMN detected_language VARCHAR(2) DEFAULT 'en';

-- Add index for language queries (performance optimization)
CREATE INDEX idx_orders_language ON orders(language);
CREATE INDEX idx_processed_emails_language ON processed_emails(detected_language);

-- Update existing records to Dutch (since current system is Dutch-focused)
-- This ensures backward compatibility
UPDATE orders SET language = 'nl' WHERE language = 'en';
UPDATE processed_emails SET detected_language = 'nl' WHERE detected_language = 'en';

-- Add comment for documentation
COMMENT ON COLUMN orders.language IS 'ISO 639-1 language code (nl, de, fr, en)';
COMMENT ON COLUMN processed_emails.detected_language IS 'ISO 639-1 language code detected from email content';