-- Create email_accounts table
-- This table stores connected email accounts for scanning (Gmail, Outlook, etc.)

CREATE TABLE email_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
    email TEXT NOT NULL,
    -- Encrypted tokens for OAuth access
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    -- Scanning metadata
    last_scan_at TIMESTAMP WITH TIME ZONE,
    scan_enabled BOOLEAN DEFAULT true,
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Constraints
    UNIQUE(user_id, email)
);

-- Create indexes for performance
CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
CREATE INDEX idx_email_accounts_provider ON email_accounts(provider);
CREATE INDEX idx_email_accounts_scan_enabled ON email_accounts(scan_enabled);
CREATE INDEX idx_email_accounts_last_scan_at ON email_accounts(last_scan_at);

-- Create trigger for updated_at
CREATE TRIGGER update_email_accounts_updated_at
    BEFORE UPDATE ON email_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_accounts table
CREATE POLICY "Users can view own email accounts" ON email_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = email_accounts.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert own email accounts" ON email_accounts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = email_accounts.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own email accounts" ON email_accounts
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = email_accounts.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete own email accounts" ON email_accounts
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = email_accounts.user_id 
            AND users.clerk_id = auth.uid()::text
        )
    );