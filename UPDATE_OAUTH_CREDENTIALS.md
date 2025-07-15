# Update OAuth Credentials

## Quick Steps:

1. Open the file `.env.local` in your text editor

2. Find these two lines:
```
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

3. Replace them with your actual credentials:
```
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

4. Save the file

5. Tell me when you're done and I'll restart the server!

## Example:
If your credentials are:
- Client ID: `123456789-abc.apps.googleusercontent.com`
- Client Secret: `GOCSPX-1234567890abcdef`

Then update to:
```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-1234567890abcdef
```

That's it! No quotes needed, just paste the values directly.