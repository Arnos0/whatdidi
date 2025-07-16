-- Check existing Coolblue orders
SELECT id, order_number, amount, status, created_at 
FROM orders 
WHERE retailer = 'Coolblue'
ORDER BY created_at DESC;

-- Delete Coolblue orders (uncomment to run)
-- DELETE FROM orders WHERE retailer = 'Coolblue';

-- Clean up processed emails for Coolblue (uncomment to run)
-- DELETE FROM processed_emails WHERE sender ILIKE '%coolblue%';