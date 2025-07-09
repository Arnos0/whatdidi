-- Create orders table
-- This table stores all purchase orders from users

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Order details
    order_number TEXT NOT NULL,
    retailer TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    
    -- Order status
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
    ),
    
    -- Tracking information
    tracking_number TEXT,
    carrier TEXT,
    
    -- Dates
    order_date DATE NOT NULL,
    estimated_delivery DATE,
    
    -- Email integration
    email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL,
    raw_email_data JSONB,
    
    -- Manual order flag
    is_manual BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, order_number, retailer)
);

-- Create indexes for performance
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_retailer ON orders(retailer);
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX idx_orders_email_account_id ON orders(email_account_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Create composite indexes for common queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders table
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = orders.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = orders.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = orders.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own orders" ON orders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = orders.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );