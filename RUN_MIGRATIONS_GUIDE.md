# How to Run Database Migrations

The email scanning feature requires new database tables. You need to run the migration manually in Supabase.

## Steps:

1. **Go to your Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Email Scan Tables Migration**
   - Click "New query"
   - Copy and paste the contents of this file:
     `supabase/migrations/20240101000007_create_email_scan_tables.sql`
   - Click "Run" or press Ctrl+Enter

4. **Verify the Migration**
   - You should see "Success. No rows returned" message
   - Check the "Table Editor" to confirm these tables exist:
     - `email_scan_jobs`
     - `processed_emails`
   - Check that `email_accounts` table has new columns:
     - `scan_config`
     - `last_full_scan_at`
     - `total_emails_processed`
     - `total_orders_created`

## Migration File Location:
`/supabase/migrations/20240101000007_create_email_scan_tables.sql`

## Troubleshooting:

### If you get an error about existing tables:
- The migration may have partially run
- Check which tables/columns already exist
- Run only the parts that are missing

### If you get permission errors:
- Make sure you're using the correct project
- Ensure your database user has CREATE TABLE permissions

## After Running Migrations:

1. Go back to https://whatdidi.shop/settings
2. Click "Scan Emails" on your Gmail account
3. The scan should now work correctly!

## Quick Copy Command:

If you have the project locally, you can copy the migration content:
```bash
cat supabase/migrations/20240101000007_create_email_scan_tables.sql | pbcopy  # macOS
cat supabase/migrations/20240101000007_create_email_scan_tables.sql | xclip   # Linux
```