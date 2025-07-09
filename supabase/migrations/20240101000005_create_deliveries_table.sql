-- Create deliveries table
-- This table stores delivery tracking information for orders

CREATE TABLE deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Tracking details
    carrier TEXT NOT NULL,
    tracking_number TEXT NOT NULL,
    
    -- Status information
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned')
    ),
    
    -- Timing information
    last_update TIMESTAMP WITH TIME ZONE,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    
    -- Address information
    delivery_address JSONB,
    
    -- Tracking events (array of status updates)
    tracking_events JSONB[] DEFAULT '{}',
    
    -- Webhook/API metadata
    webhook_url TEXT,
    last_webhook_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(tracking_number, carrier)
);

-- Create indexes for performance
CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_tracking_number ON deliveries(tracking_number);
CREATE INDEX idx_deliveries_carrier ON deliveries(carrier);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_estimated_delivery ON deliveries(estimated_delivery);
CREATE INDEX idx_deliveries_last_update ON deliveries(last_update DESC);

-- Create composite indexes for common queries
CREATE INDEX idx_deliveries_carrier_tracking ON deliveries(carrier, tracking_number);
CREATE INDEX idx_deliveries_status_update ON deliveries(status, last_update DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_deliveries_updated_at
    BEFORE UPDATE ON deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deliveries table
-- Users can access deliveries if they own the parent order
CREATE POLICY "Users can view own deliveries" ON deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = deliveries.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own deliveries" ON deliveries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = deliveries.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own deliveries" ON deliveries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = deliveries.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own deliveries" ON deliveries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = deliveries.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );