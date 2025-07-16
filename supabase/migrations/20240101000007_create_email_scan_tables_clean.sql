-- Create email_scan_jobs table to track scanning progress
CREATE TABLE email_scan_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    scan_type TEXT NOT NULL DEFAULT 'incremental' CHECK (scan_type IN ('full', 'incremental')),
    date_from TIMESTAMP WITH TIME ZONE,
    date_to TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    emails_found INTEGER DEFAULT 0,
    emails_processed INTEGER DEFAULT 0,
    orders_created INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    last_error TEXT,
    next_page_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processed_emails table to track which emails we've already processed
CREATE TABLE processed_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_account_id UUID NOT NULL REFERENCES email_accounts(id) ON DELETE CASCADE,
    gmail_message_id TEXT NOT NULL,
    gmail_thread_id TEXT,
    email_date TIMESTAMP WITH TIME ZONE,
    subject TEXT,
    sender TEXT,
    retailer_detected TEXT,
    order_created BOOLEAN DEFAULT false,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    parse_error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email_account_id, gmail_message_id)
);

-- Add scan configuration to email_accounts
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS scan_config JSONB DEFAULT '{"date_range": "6_months", "auto_scan": true, "scan_interval_hours": 24}'::jsonb;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS last_full_scan_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS total_emails_processed INTEGER DEFAULT 0;
ALTER TABLE email_accounts ADD COLUMN IF NOT EXISTS total_orders_created INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX idx_email_scan_jobs_email_account_id ON email_scan_jobs(email_account_id);
CREATE INDEX idx_email_scan_jobs_status ON email_scan_jobs(status);
CREATE INDEX idx_email_scan_jobs_created_at ON email_scan_jobs(created_at DESC);

CREATE INDEX idx_processed_emails_email_account_id ON processed_emails(email_account_id);
CREATE INDEX idx_processed_emails_gmail_message_id ON processed_emails(gmail_message_id);
CREATE INDEX idx_processed_emails_email_date ON processed_emails(email_date DESC);
CREATE INDEX idx_processed_emails_retailer ON processed_emails(retailer_detected);
CREATE INDEX idx_processed_emails_order_created ON processed_emails(order_created);

-- Update triggers for updated_at
CREATE TRIGGER update_email_scan_jobs_updated_at
    BEFORE UPDATE ON email_scan_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for email_scan_jobs
ALTER TABLE email_scan_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email scan jobs" ON email_scan_jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = email_scan_jobs.email_account_id 
            AND email_accounts.user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can create scan jobs for their accounts" ON email_scan_jobs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = email_scan_jobs.email_account_id 
            AND email_accounts.user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Users can update their own scan jobs" ON email_scan_jobs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = email_scan_jobs.email_account_id 
            AND email_accounts.user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.uid()::text
            )
        )
    );

-- RLS policies for processed_emails
ALTER TABLE processed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own processed emails" ON processed_emails
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM email_accounts 
            WHERE email_accounts.id = processed_emails.email_account_id 
            AND email_accounts.user_id IN (
                SELECT id FROM users WHERE clerk_id = auth.uid()::text
            )
        )
    );

CREATE POLICY "Service role can insert processed emails" ON processed_emails
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update processed emails" ON processed_emails
    FOR UPDATE USING (true);