# Supabase Database Migrations

This directory contains SQL migration files for the WhatDidiShop database schema.

## Migration Files

1. **20240101000001_create_users_table.sql**
   - Creates the `users` table synced with Clerk authentication
   - Includes RLS policies for user data access
   - Adds indexes for performance

2. **20240101000002_create_email_accounts_table.sql**
   - Creates the `email_accounts` table for Gmail/Outlook integration
   - Stores encrypted OAuth tokens
   - Includes scanning metadata and RLS policies

3. **20240101000003_create_orders_table.sql**
   - Creates the `orders` table for purchase tracking
   - Includes order status, tracking, and email integration
   - Comprehensive indexes for performance

4. **20240101000004_create_order_items_table.sql**
   - Creates the `order_items` table for individual purchase items
   - Links to orders with CASCADE delete
   - Includes product information and pricing

5. **20240101000005_create_deliveries_table.sql**
   - Creates the `deliveries` table for package tracking
   - Stores tracking events and carrier information
   - Includes webhook support for real-time updates

6. **20240101000006_create_additional_functions.sql**
   - Creates utility functions for statistics and data management
   - Includes triggers for automatic status syncing
   - Provides optimized queries for the application

## How to Run Migrations

### Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. Run migrations:
   ```bash
   supabase db push
   ```

### Manual Execution

You can also run these migrations manually in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Execute them in order (001, 002, 003, etc.)

## Database Schema Overview

### Tables and Relationships

```
users (1) ----< email_accounts
  |
  └----< orders (1) ----< order_items
         |
         └----< deliveries (1:1)
```

### Key Features

- **Row Level Security (RLS)**: All tables have RLS policies to ensure users can only access their own data
- **Automatic Timestamps**: All tables have `created_at` and `updated_at` timestamps
- **Foreign Key Constraints**: Proper relationships with CASCADE deletes where appropriate
- **Indexes**: Optimized indexes for common query patterns
- **JSON Storage**: Flexible JSON columns for metadata and tracking events
- **Triggers**: Automatic data synchronization and cleanup

### Important Notes

- The `users` table is synced with Clerk authentication using `clerk_id`
- Email tokens are stored encrypted in the `email_accounts` table
- Orders can be linked to email accounts for automatic parsing
- Delivery tracking events are stored as JSON arrays for flexibility
- All monetary values use DECIMAL(10, 2) for precision

## Environment Variables

Make sure to set these environment variables in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Security

- All tables have Row Level Security enabled
- Policies ensure users can only access their own data
- Service functions use `SECURITY DEFINER` for controlled access
- Email tokens and sensitive data should be encrypted at the application level