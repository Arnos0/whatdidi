# WhatDidiShop Security Review Command

Please perform a comprehensive security review specifically for the WhatDidiShop project. This command is tailored for this codebase and will extract security practices from the project's claude.md file.

## Extract Project Security Documentation
1. Find and display the security best practices section from this project's claude.md file
2. Look for the "## SECURITY BEST PRACTICES" section and extract all content until the next numbered section
3. Display the WhatDidiShop-specific security guidelines

## Security Analysis Tasks
Perform the following security checks specific to this Next.js/Supabase application:

### 1. Debug Information Exposure
- Search for console.log statements in TypeScript/JavaScript files
- Look for any development logging that might expose user data, order information, or email parsing details
- Check for error messages that reveal internal system information

### 2. Environment Variable Security  
- Search for hardcoded SUPABASE_SERVICE_ROLE_KEY usage outside of .env files
- Check for process.env references that might expose sensitive environment variables
- Verify proper environment variable handling for OAuth credentials and API keys

### 3. Authentication & Authorization
- Review API routes in app/api for proper authentication implementation
- Look for exported async functions that should include auth() calls
- Verify protected routes have proper user authentication
- Check email account access controls

### 4. Email Processing Security
- Review email parsing logic for potential security vulnerabilities
- Check for proper sanitization of email content before processing
- Verify secure handling of retailer order information extracted from emails
- Look for potential XSS vulnerabilities in email content display

### 5. Database Security
- Check Supabase RLS (Row Level Security) policies
- Verify proper user data isolation
- Look for potential SQL injection in database queries
- Review order data access controls

### 6. API Security
- Check rate limiting implementation
- Verify proper input validation on all API endpoints
- Look for potential data exposure in API responses
- Review OAuth implementation security

## WhatDidiShop-Specific Quick Commands

```bash
# Check for debug logging in this project
grep -r 'console.log' --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' . --exclude-dir=node_modules

# Check for service role key exposure
grep -r 'SUPABASE_SERVICE_ROLE_KEY' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules .

# Check for environment variable exposure
grep -r 'process.env' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules . | grep -v '.env'

# Check authentication in API routes
grep -r 'export async function' app/api --include='*.ts' -A 5 | grep -B 5 'auth()'

# Check for sensitive data in logs
grep -r 'userId\|email\|token\|order' --include='*.ts' --include='*.tsx' . | grep 'console.log'

# Check email processing security
grep -r 'innerHTML\|dangerouslySetInnerHTML' --include='*.tsx' --include='*.ts' .

# Check for hardcoded secrets
grep -r 'key\|secret\|password\|token' --include='*.ts' --include='*.tsx' . | grep -v 'process.env'
```

## Report Format
Present findings in a clear, prioritized format specific to WhatDidiShop:

1. **Critical Issues** - Immediate security risks (data exposure, authentication bypass)
2. **High Priority** - Important security concerns (email processing, user data)
3. **Medium Priority** - Security improvements (logging, error handling)
4. **Best Practices** - Recommendations for security hardening

For each finding, include:
- Description of the issue
- Location (file and line number)
- Risk level and impact on user data/orders
- Recommended fix with code examples
- Priority level for implementation

Focus particularly on:
- User email account security
- Order data protection
- Email parsing safety
- OAuth credential protection
- Supabase security configuration