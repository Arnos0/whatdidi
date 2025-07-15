# OAuth Production Setup Guide

This guide will help you configure Google and Microsoft OAuth for production use on whatdidi.shop.

## Prerequisites
- Access to Google Cloud Console
- Access to Microsoft Azure Portal
- Access to Vercel dashboard

## Step 1: Generate Token Encryption Key

First, generate a secure encryption key for token storage:

```bash
openssl rand -base64 32
```

Save this key - you'll need it for Vercel environment variables.

## Step 2: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create one if needed)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (or create one)
5. Click on it to edit
6. In **Authorized redirect URIs**, add:
   - `https://whatdidi.shop/api/auth/google/callback`
   - Keep existing localhost URIs for development
7. Click **Save**

## Step 3: Configure Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Select your application (or create one)
4. Go to **Authentication** in the left menu
5. Under **Platform configurations** → **Web**, add redirect URI:
   - `https://whatdidi.shop/api/auth/microsoft/callback`
   - Keep existing localhost URIs for development
6. Click **Save**

## Step 4: Update Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **whatdidi** project
3. Go to **Settings** → **Environment Variables**
4. Add/Update the following variables:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | (your Google client ID) |
| `GOOGLE_CLIENT_SECRET` | (your Google client secret) |
| `GOOGLE_REDIRECT_URI` | `https://whatdidi.shop/api/auth/google/callback` |
| `MICROSOFT_CLIENT_ID` | (your Microsoft client ID) |
| `MICROSOFT_CLIENT_SECRET` | (your Microsoft client secret) |
| `MICROSOFT_REDIRECT_URI` | `https://whatdidi.shop/api/auth/microsoft/callback` |
| `TOKEN_ENCRYPTION_KEY` | (the key you generated in Step 1) |

5. Click **Save** for each variable
6. **IMPORTANT**: Redeploy your application for the changes to take effect

## Step 5: Test the Integration

1. Visit https://whatdidi.shop/settings
2. Try connecting a Gmail account
3. Try connecting an Outlook account
4. Verify both OAuth flows complete successfully

## Troubleshooting

### "Redirect URI mismatch" error
- Double-check the redirect URIs match exactly (including https://)
- Ensure no trailing slashes
- Wait a few minutes for OAuth provider changes to propagate

### "Invalid client" error
- Verify client ID and secret are correctly set in Vercel
- Check you're using production credentials, not development ones

### Token encryption errors
- Ensure TOKEN_ENCRYPTION_KEY is set in production
- The key should be a base64 string

## Security Notes

- Never commit OAuth credentials to git
- Keep different OAuth apps for development and production
- Regularly rotate your TOKEN_ENCRYPTION_KEY
- Monitor OAuth access logs in Google/Microsoft consoles