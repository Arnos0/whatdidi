-- Additional database functions and utilities

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_statistics(user_clerk_id TEXT)
RETURNS JSON AS $$
DECLARE
    user_uuid UUID;
    stats JSON;
BEGIN
    -- Get user UUID from clerk_id
    SELECT id INTO user_uuid FROM users WHERE clerk_id = user_clerk_id;
    
    IF user_uuid IS NULL THEN
        RETURN '{"error": "User not found"}';
    END IF;
    
    -- Calculate statistics
    SELECT json_build_object(
        'total_orders', COUNT(*),
        'total_spent', COALESCE(SUM(amount), 0),
        'pending_orders', COUNT(*) FILTER (WHERE status = 'pending'),
        'shipped_orders', COUNT(*) FILTER (WHERE status = 'shipped'),
        'delivered_orders', COUNT(*) FILTER (WHERE status = 'delivered'),
        'avg_order_value', COALESCE(AVG(amount), 0),
        'last_order_date', MAX(order_date)
    ) INTO stats
    FROM orders
    WHERE user_id = user_uuid;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update order status based on delivery status
CREATE OR REPLACE FUNCTION sync_order_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update order status based on delivery status
    UPDATE orders 
    SET status = CASE 
        WHEN NEW.status = 'delivered' THEN 'delivered'
        WHEN NEW.status IN ('picked_up', 'in_transit', 'out_for_delivery') THEN 'shipped'
        ELSE orders.status
    END,
    updated_at = NOW()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync order status when delivery status changes
CREATE TRIGGER sync_order_status_trigger
    AFTER UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION sync_order_status();

-- Function to clean up old tracking events (keep only last 50 events)
CREATE OR REPLACE FUNCTION cleanup_tracking_events()
RETURNS TRIGGER AS $$
BEGIN
    -- Keep only the last 50 tracking events
    IF array_length(NEW.tracking_events, 1) > 50 THEN
        NEW.tracking_events := NEW.tracking_events[array_length(NEW.tracking_events, 1) - 49 : array_length(NEW.tracking_events, 1)];
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to cleanup tracking events
CREATE TRIGGER cleanup_tracking_events_trigger
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_tracking_events();

-- Function to get orders with delivery status
CREATE OR REPLACE FUNCTION get_orders_with_delivery(user_clerk_id TEXT, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
    order_id UUID,
    order_number TEXT,
    retailer TEXT,
    amount DECIMAL(10, 2),
    currency TEXT,
    order_status TEXT,
    order_date DATE,
    tracking_number TEXT,
    carrier TEXT,
    delivery_status TEXT,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get user UUID from clerk_id
    SELECT id INTO user_uuid FROM users WHERE clerk_id = user_clerk_id;
    
    IF user_uuid IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.retailer,
        o.amount,
        o.currency,
        o.status,
        o.order_date,
        o.tracking_number,
        d.carrier,
        d.status,
        d.estimated_delivery,
        d.last_update,
        o.created_at
    FROM orders o
    LEFT JOIN deliveries d ON o.id = d.order_id
    WHERE o.user_id = user_uuid
    ORDER BY o.created_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;