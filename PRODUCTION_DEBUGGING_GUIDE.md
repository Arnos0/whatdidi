# Production Debugging Guide - User Not Found Error

## Issue Summary
Users authenticated with Clerk receive "User not found" error when creating orders in production at whatdidi.shop.

## Quick Diagnosis Script

```bash
# Run this in your terminal to check if service role key is in Vercel
vercel env ls production | grep SUPABASE_SERVICE_ROLE_KEY
```

## Step-by-Step Debugging

### Step 1: Verify Environment Variables in Vercel

```bash
# List all production environment variables
vercel env ls production

# Check for these REQUIRED variables:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY (⚠️ MOST LIKELY MISSING!)
```

If `SUPABASE_SERVICE_ROLE_KEY` is missing:
```bash
# Add it from your .env.local file
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# When prompted, paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlmb3NrbWdnaXdmc3B3cHBtcmF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA4Mzg0MCwiZXhwIjoyMDY3NjU5ODQwfQ.h0_xaPQGPPBHf3kX74UJIHTHLYzadhxTBW6CZV_I8DA
```

### Step 2: Check Production Database

Go to your Supabase dashboard and run this SQL:

```sql
-- Check if any users exist
SELECT clerk_id, email, created_at FROM users ORDER BY created_at DESC LIMIT 10;

-- Check if YOUR specific user exists (get your clerk_id from Clerk dashboard)
SELECT * FROM users WHERE email = 'your-email@example.com';
```

### Step 3: Manual User Creation (Quick Fix)

If no users exist in production database:

```sql
-- Get your Clerk user ID from: https://dashboard.clerk.com/apps/YOUR_APP/users
-- Then run this in Supabase SQL Editor:

INSERT INTO users (clerk_id, email, name, created_at, updated_at) 
VALUES (
  'user_2bxfKPLRmZXXXXXXXXXX', -- Replace with your actual Clerk user ID
  'your-actual@email.com',      -- Replace with your email
  'Your Name',                  -- Replace with your name
  NOW(),
  NOW()
)
ON CONFLICT (clerk_id) 
DO UPDATE SET 
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();
```

### Step 4: Test Sync Endpoint

After adding environment variables and redeploying:

```bash
# Test locally if sync works
curl -X POST http://localhost:3002/api/sync-user \
  -H "Cookie: YOUR_AUTH_COOKIES"

# Or use the browser console on whatdidi.shop:
fetch('/api/sync-user', { method: 'POST' }).then(r => r.json()).then(console.log)
```

### Step 5: Check Vercel Function Logs

1. Go to: https://vercel.com/YOUR_USERNAME/whatdidi/functions
2. Click on `api/sync-user`
3. Check recent invocations for errors
4. Look for "Failed to sync user" or database connection errors

### Step 6: Force Redeploy After Fix

```bash
# After adding missing environment variables
vercel --prod --force
```

## Common Issues & Solutions

### Issue 1: Missing Service Role Key
**Symptom**: sync-user returns 500 error  
**Fix**: Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars

### Issue 2: Database Connection Failed
**Symptom**: Timeout errors in logs  
**Fix**: Check Supabase is not paused, verify URL is correct

### Issue 3: Clerk User Not Found
**Symptom**: 404 from sync-user  
**Fix**: Clear cookies, sign out and back in

## Verification Checklist

- [ ] All 5 required environment variables are in Vercel
- [ ] Redeployed after adding variables
- [ ] User exists in Supabase users table
- [ ] sync-user endpoint returns 200
- [ ] Can create orders successfully

## Emergency Contact Info

- Supabase Dashboard: https://app.supabase.com/project/yfoskmggiwfspwppmrax
- Clerk Dashboard: https://dashboard.clerk.com
- Vercel Dashboard: https://vercel.com/dashboard

## Related Files
- `/lib/supabase/server-client.ts` - Uses service role key
- `/app/api/sync-user/route.ts` - Syncs Clerk user to Supabase
- `/app/api/orders/route.ts` - Creates orders (requires user in DB)