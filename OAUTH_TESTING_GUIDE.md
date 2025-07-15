# OAuth Email Integration Testing Guide

## Quick Start

### 1. Generate Encryption Key
```bash
node scripts/generate-encryption-key.js
```
Copy the generated key for your `.env.local` file.

### 2. Set Up OAuth Providers

#### Google (Gmail)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Gmail API:
   - APIs & Services → Library
   - Search "Gmail API" → Enable
4. Create credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: "WhatDidiShop Dev"
   - Authorized redirect URIs: `http://localhost:3002/api/auth/google/callback`
   - Save Client ID and Secret

#### Microsoft (Outlook)
1. Go to [Azure Portal](https://portal.azure.com/)
2. Azure Active Directory → App registrations → New registration
3. Configure:
   - Name: "WhatDidiShop Dev"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web - `http://localhost:3002/api/auth/microsoft/callback`
4. After creation:
   - Copy Application (client) ID
   - Certificates & secrets → New client secret
   - Copy the secret value (only shown once!)

### 3. Configure Environment
Create/update `.env.local`:
```env
# Google OAuth (for Gmail)
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback

# Microsoft OAuth (for Outlook)
MICROSOFT_CLIENT_ID=your_microsoft_application_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:3002/api/auth/microsoft/callback

# Token Encryption (use generated key from step 1)
TOKEN_ENCRYPTION_KEY=your_generated_encryption_key_here
```

### 4. Start Testing
```bash
# Start the dev server
./start-dev.sh

# Navigate to settings
open http://localhost:3002/settings
```

## Testing Checklist

### ✅ Basic Flow
- [ ] Can connect Gmail account
- [ ] Can connect Outlook account
- [ ] Connected accounts show email address
- [ ] Shows connection time
- [ ] Can disconnect accounts

### ✅ Security
- [ ] Tokens are encrypted in database
- [ ] No tokens exposed in network requests
- [ ] Can't access other users' accounts
- [ ] State parameter prevents CSRF

### ✅ Error Handling
- [ ] Cancel at provider login shows error
- [ ] Invalid credentials show error
- [ ] Reconnecting same email updates tokens
- [ ] Network errors handled gracefully

### ✅ UI/UX
- [ ] Loading states work correctly
- [ ] Success toasts appear
- [ ] Error messages are helpful
- [ ] Mobile responsive

## Troubleshooting

### Common Issues

#### "Redirect URI mismatch"
- Ensure the URI in provider console EXACTLY matches your .env.local
- Include the port (:3002)
- Use http:// for localhost, not https://

#### "Access blocked: This app's request is invalid"
- For Google: Add your Google account as a test user in OAuth consent screen
- For Microsoft: Ensure redirect URI is correctly configured

#### Tokens not saving
- Check TOKEN_ENCRYPTION_KEY is set
- Verify Supabase connection
- Check user is properly authenticated

#### OAuth flow hangs
- Check browser console for errors
- Verify all environment variables are set
- Check server logs: `tail -f /tmp/nextjs.log`

### Database Verification
```sql
-- Check connected accounts (run in Supabase SQL editor)
SELECT 
  id,
  provider,
  email,
  scan_enabled,
  last_scan_at,
  created_at
FROM email_accounts
WHERE user_id = 'your-user-id';

-- Verify tokens are encrypted
SELECT 
  LEFT(access_token, 20) as token_preview,
  LENGTH(access_token) as token_length
FROM email_accounts;
```

## Advanced Testing

### Test Token Refresh (Phase 11)
```bash
# Manually expire token
UPDATE email_accounts 
SET token_expires_at = NOW() - INTERVAL '1 hour'
WHERE id = 'account-id';

# Test refresh flow in next phase
```

### Performance Testing
- Connect multiple accounts
- Disconnect all at once
- Measure API response times

### Security Audit
1. Try accessing `/api/email-accounts` without auth
2. Try deleting another user's account
3. Verify HTTPS in production
4. Check for timing attacks

## Production Considerations

Before going to production:
1. Use HTTPS redirect URIs
2. Set up proper OAuth consent screen (Google)
3. Get app verified (if public)
4. Implement rate limiting
5. Add monitoring for failed OAuth attempts
6. Set up alerts for token refresh failures

## Next Steps

After successful testing:
1. ✅ OAuth flow working
2. ✅ Accounts connected and stored
3. ➡️ Ready for Phase 11: Email Parsing
4. ➡️ Can fetch emails with stored tokens
5. ➡️ Implement background scanning

---

**Need help?** Check server logs: `tail -f /tmp/nextjs.log`