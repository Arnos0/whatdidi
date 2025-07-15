# Production Issue - User Not Found Error

## Issue Description
When trying to create an order in production (whatdidi.shop), users get a "User not found" error even though they are authenticated with Clerk.

## Root Cause
The user exists in Clerk but is not synced to the Supabase database in production.

## Troubleshooting Steps for Tomorrow

### 1. Check Environment Variables in Vercel
Go to Vercel Dashboard → Project Settings → Environment Variables and verify these are set:
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (MOST LIKELY MISSING!)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### 2. Check Supabase Production Database
1. Go to production Supabase dashboard
2. Check SQL Editor → Run this query:
   ```sql
   SELECT * FROM users;
   ```
3. Check if your user exists. If not, the sync is failing.

### 3. Check Vercel Function Logs
1. Go to Vercel Dashboard → Functions tab
2. Look for `/api/sync-user` logs
3. Check for any error messages

### 4. Quick Fix Options

#### Option A: Add Missing Environment Variable
If `SUPABASE_SERVICE_ROLE_KEY` is missing:
1. Get it from Supabase → Settings → API → Service Role Key
2. Add it to Vercel environment variables
3. Redeploy

#### Option B: Manual User Insert (Temporary Fix)
Run this in Supabase SQL Editor:
```sql
-- First, find your Clerk user ID from the Clerk dashboard
INSERT INTO users (clerk_id, email, name, created_at, updated_at) 
VALUES (
  'user_xxxxxxxxxxxxx', -- Your Clerk user ID
  'your-email@example.com', 
  'Your Name',
  NOW(),
  NOW()
)
ON CONFLICT (clerk_id) 
DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();
```

### 5. Test After Fix
1. Sign out and sign back in
2. Try creating an order
3. Check if the sync-user endpoint works

### 6. Long-term Solution
Consider adding a webhook from Clerk to automatically sync users on signup/update instead of relying on the sync-user endpoint.

## Related Files
- `/app/api/sync-user/route.ts` - The sync endpoint
- `/lib/supabase/server-queries.ts` - Contains `syncFromClerk` function
- `/app/(dashboard)/orders/page.tsx` - Calls sync-user on mount

## Last Working State
- Works perfectly in local development
- All features including order creation work locally
- Only production is affected

---
Created: 2025-01-14
Issue discovered after Phase 8 deployment