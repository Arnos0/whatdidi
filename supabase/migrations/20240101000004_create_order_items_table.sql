-- Create order_items table
-- This table stores individual items within orders

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Item details
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    price DECIMAL(10, 2),
    
    -- Product information
    product_name TEXT,
    product_sku TEXT,
    product_brand TEXT,
    product_category TEXT,
    
    -- URLs and images
    image_url TEXT,
    product_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_name ON order_items(product_name);
CREATE INDEX idx_order_items_product_category ON order_items(product_category);
CREATE INDEX idx_order_items_created_at ON order_items(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_items table
-- Users can access order items if they own the parent order
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = order_items.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = order_items.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own order items" ON order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = order_items.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own order items" ON order_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM orders 
            JOIN users ON users.id = orders.user_id
            WHERE orders.id = order_items.order_id 
            AND users.clerk_id = auth.uid()::text
        )
    );