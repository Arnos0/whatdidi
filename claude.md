# WhatDidiShop - Development Documentation

## 🚨 CRITICAL: THIS PROJECT RUNS ON PORT 3002 - NOT 3000! 🚨
**ALWAYS USE: `./start-dev.sh` or `PORT=3002 npm run dev`**
**ACCESS AT: http://localhost:3002**

## 📧 EMAIL PARSING SYSTEM
**IMPORTANT**: For detailed information about the email parsing system, AI integration, and debugging, see:
→ **[EMAIL_PARSING_SYSTEM.md](./EMAIL_PARSING_SYSTEM.md)**

This includes:
- Gmail integration details
- AI prompt engineering with Gemini
- Coolblue parsing issues and solutions
- Debugging strategies
- Future improvements

## 🚨 PRIORITY: Migrate to Gemini 2.0 Flash (2025-07-16)

We implemented AI email parsing with Claude but hit severe rate limits:
- Only 30 emails/minute (40k token limit)
- Costs $0.003/email
- Poor user experience (stuck progress bar)

**Next session: Implement Gemini 2.0 Flash**
- 10x faster (200+ emails/min)
- 40x cheaper ($0.00007/email)
- No rate limits
- See GEMINI_MIGRATION_PLAN.md for details

## RULES

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. **SECURITY REQUIREMENT**: Before marking any feature complete, conduct a security review following the Security Best Practices section below. Fix any vulnerabilities found.
8. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

## SECURITY BEST PRACTICES

### Overview
**IMPORTANT**: All code must follow these security practices from the start. Security is not optional or an afterthought. Every feature must be secure by default.

### 1. Authentication & Authorization
- **Always verify authentication** in API routes using `auth()` from Clerk
- **Never trust client-side authentication** - always verify server-side
- **Check authorization** - authenticated users should only access their own data
- **Use Row Level Security (RLS)** in Supabase for additional protection

### 2. Input Validation & Sanitization
- **Validate ALL inputs** using Zod schemas before processing
- **Set reasonable limits** on string lengths, array sizes, and numeric ranges
- **Sanitize user input** before displaying or storing
- **Escape special characters** in database queries to prevent injection

Example:
```typescript
const schema = z.object({
  page: z.coerce.number().min(1).max(1000),
  limit: z.coerce.number().min(1).max(100),
  search: z.string().max(100).optional(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional()
})
```

### 3. Sensitive Data Protection
- **NEVER log sensitive data** (user IDs, emails, tokens, etc.)
- **NEVER send sensitive data to the client** unnecessarily
- **Use server-only files** for code that handles secrets:
  ```typescript
  import 'server-only'  // Add this to files with sensitive operations
  ```
- **Service role keys** must ONLY be used in server-only files
- **Remove console.log statements** before committing code

### 4. API Security
- **All API routes must:**
  - Authenticate the user
  - Validate input parameters
  - Handle errors without leaking information
  - Return generic error messages to clients
  - Log detailed errors server-side only

Example API route structure:
```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Input validation
    const validation = schema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 3. Authorization & business logic
    // ... your code here ...

    // 4. Return data (filter sensitive fields)
    return NextResponse.json({ data: filteredData })
  } catch (error) {
    // 5. Generic error response
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
```

### 5. Database Security
- **Use parameterized queries** (Supabase client does this automatically)
- **Apply database-level filtering** instead of fetching all data and filtering in memory
- **Use proper indexes** to prevent slow queries that could cause DoS
- **Implement proper RLS policies** that work with your auth system

### 6. Client-Side Security
- **Never expose API keys** or secrets in client code
- **Validate data on the client** for UX, but ALWAYS validate server-side
- **Use HTTPS** for all communications
- **Implement proper CORS** settings

### 7. Error Handling
- **Client errors** should be generic: "Request failed", "Invalid input"
- **Server logs** can contain detailed error information
- **Never expose** stack traces, database errors, or system information to clients

### 8. Security Checklist for New Features

Before marking any feature complete, verify:

- [ ] All API routes check authentication
- [ ] All inputs are validated with Zod schemas
- [ ] No sensitive data in console.log statements
- [ ] Service role key is only used in server-only files
- [ ] Database queries filter data at the database level
- [ ] Error messages don't leak system information
- [ ] No hardcoded secrets or API keys
- [ ] Authorization checks ensure users only access their own data
- [ ] Rate limiting is considered for resource-intensive endpoints
- [ ] File uploads are validated and size-limited

### 9. Common Vulnerabilities to Avoid

1. **SQL Injection** - Always use parameterized queries
2. **XSS** - Sanitize all user input before rendering
3. **CSRF** - Use proper tokens for state-changing operations
4. **Information Disclosure** - Generic error messages, no sensitive logs
5. **Broken Access Control** - Always verify ownership of resources
6. **Security Misconfiguration** - Follow the principle of least privilege
7. **Insufficient Logging** - Log security events for monitoring

### 10. When to Use Server-Only Code

Create server-only files when:
- Using service role keys or admin privileges
- Processing sensitive data (tokens, passwords)
- Performing administrative operations
- Integrating with external services using secret keys

Mark these files with `import 'server-only'` at the top.

## 1. PROJECT OVERVIEW

### App Name and Purpose
**WhatDidiShop** is a purchase tracking web application that helps users centralize and monitor all their online purchases in one place. It automatically scans email accounts for order confirmations, tracks deliveries, and provides spending insights.

### Key Features
- Automatic email scanning for order confirmations
- Real-time delivery tracking
- Spending analytics and insights
- Manual order entry with receipt upload
- Multi-retailer support (Bol.com, Coolblue, Zalando, Amazon)
- Multi-carrier tracking (PostNL, DHL, DPD)

### Target Audience
- Online shoppers who make frequent purchases
- People who want to track their spending habits
- Users who receive packages from multiple retailers
- Anyone who wants to consolidate their purchase history

### Tech Stack Overview
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Authentication**: Clerk (Google & Microsoft OAuth)
- **Database**: Supabase (PostgreSQL)
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation
- **Deployment**: Vercel
- **Email Integration**: Gmail API, Microsoft Graph API
- **Error Tracking**: Sentry

## 2. GETTING STARTED

### Prerequisites
- Node.js 18.17 or later
- npm or yarn package manager
- Git for version control
- Supabase account
- Clerk account
- Google Cloud Console access (for Gmail API)
- Microsoft Azure account (for Outlook integration)

### Installation Steps
```bash
# Clone the repository
git clone [repository-url]
cd whatdidishop

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables Needed
Create a `.env.local` file with the following variables:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google OAuth (for Gmail)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Microsoft OAuth (for Outlook)
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_REDIRECT_URI=http://localhost:3000/api/auth/microsoft/callback

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...

# Carrier APIs
POSTNL_API_KEY=...
DHL_API_KEY=...
DPD_API_KEY=...
```

### How to Set Up Clerk
1. Create an account at https://clerk.com
2. Create a new application
3. Enable Google and Microsoft OAuth providers
4. Copy the API keys to your `.env.local` file
5. Configure allowed redirect URLs for production

### How to Set Up Supabase
1. Create an account at https://supabase.com
2. Create a new project
3. Copy the project URL and anon key to `.env.local`
4. Run the SQL migrations in `/supabase/migrations`
5. Enable Row Level Security (RLS) policies

### First-time Setup Instructions
1. Install dependencies and set up environment variables
2. Run Supabase migrations to create database schema
3. Configure Clerk authentication providers
4. Set up OAuth credentials for email providers
5. Configure carrier API keys for tracking
6. Run the development server and test authentication

## 3. PROJECT STRUCTURE

### Detailed Folder Structure
```
whatdidishop/
├── app/                      # Next.js 14 App Router
│   ├── (auth)/              # Authentication pages
│   │   ├── sign-in/         # Sign in page
│   │   └── sign-up/         # Sign up page
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── orders/          # Order management
│   │   ├── settings/        # User settings
│   │   └── layout.tsx       # Dashboard layout
│   ├── api/                 # API routes
│   │   ├── auth/            # OAuth callbacks
│   │   ├── emails/          # Email processing
│   │   ├── orders/          # Order CRUD
│   │   └── tracking/        # Delivery tracking
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Base UI components
│   │   ├── button.tsx       # Button component
│   │   ├── card.tsx         # Card component
│   │   └── ...              # Other UI components
│   ├── dashboard/           # Dashboard components
│   │   ├── OrderList.tsx    # Order list display
│   │   ├── OrderDetail.tsx  # Order detail view
│   │   └── Statistics.tsx   # Statistics widgets
│   └── email/               # Email components
│       ├── EmailParser.tsx  # Email parsing UI
│       └── EmailPreview.tsx # Email preview
├── lib/                     # Utilities and helpers
│   ├── supabase/           # Supabase integration
│   │   ├── client.ts       # Supabase client
│   │   ├── queries.ts      # Database queries
│   │   └── types.ts        # Database types
│   ├── email/              # Email parsing
│   │   ├── gmail.ts        # Gmail integration
│   │   ├── outlook.ts      # Outlook integration
│   │   └── parsers/        # Retailer-specific parsers
│   └── tracking/           # Carrier integrations
│       ├── postnl.ts       # PostNL API
│       ├── dhl.ts          # DHL API
│       └── dpd.ts          # DPD API
├── types/                   # TypeScript definitions
│   ├── database.ts         # Database types
│   ├── api.ts              # API types
│   └── index.ts            # Shared types
├── hooks/                   # Custom React hooks
│   ├── useOrders.ts        # Order data hooks
│   ├── useAuth.ts          # Authentication hooks
│   └── useTracking.ts      # Tracking hooks
├── styles/                  # Additional styles
├── public/                  # Static assets
└── supabase/               # Database files
    └── migrations/         # SQL migrations
```

### Key File Descriptions
- `app/layout.tsx`: Root layout with Clerk provider and global styles
- `app/(dashboard)/layout.tsx`: Protected dashboard layout with navigation
- `lib/supabase/client.ts`: Supabase client configuration
- `lib/email/parsers/`: Retailer-specific email parsing logic
- `components/ui/`: Reusable UI components following design system
- `middleware.ts`: Clerk authentication middleware

### Architecture Decisions
- **App Router**: Using Next.js 14 App Router for better performance and SEO
- **Server Components**: Default to server components, client components only when needed
- **Database**: Supabase for real-time capabilities and easy authentication sync
- **Styling**: Tailwind CSS for rapid development with custom design system
- **State Management**: React Query for server state, local state with React hooks
- **Type Safety**: Strict TypeScript throughout the application

## 4. DEVELOPMENT WORKFLOW

### Security During Development
1. **Never commit sensitive data** - Check files before committing
2. **Use environment variables** - Never hardcode secrets
3. **Test with minimal privileges** - Don't use admin keys for testing
4. **Review logs** - Ensure no sensitive data is logged
5. **Run security checks** - Use the security checklist before completing features

### How to Run Locally
```bash
# RECOMMENDED: Use helper scripts (avoids 2-minute timeout issues)
./start-dev.sh  # Starts server in background on port 3002
./stop-dev.sh   # Stops the server cleanly

# View server logs
tail -f /tmp/nextjs.log

# Manual start (may timeout after 2 minutes)
PORT=3002 npm run dev

# If localhost doesn't work, try binding to all interfaces
HOST=0.0.0.0 PORT=3002 npm run dev

# Production build and serve (sometimes more reliable)
npm run build
PORT=3002 npm start

# Run with debug logging
DEBUG=* PORT=3002 npm run dev
```

### Troubleshooting Network Issues
If you can't access the server at localhost:3002:
1. Check if you're in a Docker/container environment
2. Try accessing via the container's IP instead of localhost
3. Ensure firewall allows connections on port 3002
4. Try production build: `npm run build && PORT=3002 npm start`

### Server Timeout Issues
**IMPORTANT**: The development server may timeout after 2 minutes when run through Claude Code. 

**Solution**: Use the helper scripts:
- `./start-dev.sh` - Starts server in background (no timeout)
- `./stop-dev.sh` - Stops server cleanly
- `tail -f /tmp/nextjs.log` - Monitor server logs

These scripts run the server in the background without timeout issues.

### How to Test Email Parsing
1. Use the test email parser at `/dashboard/test-parser`
2. Upload sample email HTML files
3. View parsed results and debug information
4. Test with different retailer formats

### How to Add New Retailers
1. Create a new parser in `/lib/email/parsers/[retailer].ts`
2. Implement the `EmailParser` interface
3. Add retailer detection logic in `/lib/email/detector.ts`
4. Add test cases in `/tests/parsers/[retailer].test.ts`
5. Update the retailer list in documentation

### How to Add New Carriers
1. Create a new integration in `/lib/tracking/[carrier].ts`
2. Implement the `CarrierTracker` interface
3. Add carrier detection logic in `/lib/tracking/detector.ts`
4. Map carrier-specific statuses to unified model
5. Add API credentials to environment variables

## 5. API DOCUMENTATION

### API Security Requirements
**IMPORTANT**: All API endpoints must implement these security measures:

1. **Authentication**: Verify user with `await auth()` from Clerk
2. **Input Validation**: Use Zod schemas for all parameters
3. **Authorization**: Ensure users can only access their own data
4. **Error Handling**: Return generic error messages to clients
5. **Rate Limiting**: Consider implementing for resource-intensive endpoints

### Authentication Endpoints
```typescript
// OAuth callback endpoints
GET /api/auth/google/callback
GET /api/auth/microsoft/callback

// Email account management
POST /api/auth/email-accounts
DELETE /api/auth/email-accounts/:id
```

### Order Management
```typescript
// Get all orders for authenticated user
GET /api/orders
Query params:
  - page: number (1-1000)
  - limit: number (1-100)
  - status: 'pending' | 'shipped' | 'delivered'
  - search: string (max 100 chars)

// Security implementation example:
export async function GET(request: NextRequest) {
  // 1. Auth check
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  // 2. Input validation
  const params = orderQuerySchema.safeParse(searchParams)
  if (!params.success) return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  
  // 3. Get user and verify ownership
  const user = await serverUserQueries.findByClerkId(userId)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  
  // 4. Fetch data with server-side filtering
  const data = await serverOrderQueries.getByUserId(user.id, params.data)
  
  return NextResponse.json(data)
}

// Get single order
GET /api/orders/:id

// Create manual order
POST /api/orders
Body: {
  orderNumber: string (required, max 100)
  retailer: string (required, max 100)
  amount: number (required, positive)
  orderDate: string (required, ISO date)
  items: OrderItem[] (required, min 1)
}

// Update order
PATCH /api/orders/:id

// Delete order
DELETE /api/orders/:id
```

### Email Processing
```typescript
// Trigger email scan
POST /api/emails/scan
Body: {
  accountId: string
  startDate?: string
  endDate?: string
}

// Get email scan status
GET /api/emails/scan/:jobId
```

### Delivery Tracking
```typescript
// Get tracking info
GET /api/tracking/:trackingNumber
Query params:
  - carrier: 'postnl' | 'dhl' | 'dpd'

// Subscribe to tracking updates
POST /api/tracking/subscribe
Body: {
  orderId: string
  trackingNumber: string
  carrier: string
}
```

### Request/Response Formats
All API responses follow this format:
```typescript
// Success response
{
  success: true,
  data: T,
  meta?: {
    page: number,
    totalPages: number,
    totalItems: number
  }
}

// Error response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Authentication Requirements
- All `/api/*` endpoints require authentication via Clerk
- Bearer token must be included in Authorization header
- User ID is extracted from Clerk session

## 6. DATABASE SCHEMA

### Tables

#### users
Synced with Clerk authentication
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### email_accounts
Connected email accounts for scanning
```sql
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'gmail' or 'outlook'
  email TEXT NOT NULL,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);
```

#### orders
Main orders table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  retailer TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  tracking_number TEXT,
  order_date DATE NOT NULL,
  estimated_delivery DATE,
  email_account_id UUID REFERENCES email_accounts(id),
  raw_email_data JSONB, -- Store original email data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, order_number, retailer)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
```

#### order_items
Individual items within orders
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10, 2),
  image_url TEXT,
  product_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

#### deliveries
Delivery tracking information
```sql
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL, -- 'postnl', 'dhl', 'dpd', etc.
  tracking_number TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed'
  last_update TIMESTAMP WITH TIME ZONE,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  delivery_address JSONB,
  tracking_events JSONB[], -- Array of tracking events
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tracking_number, carrier)
);

CREATE INDEX idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX idx_deliveries_tracking_number ON deliveries(tracking_number);
```

### Relationships
- Users -> Email Accounts: One-to-many
- Users -> Orders: One-to-many
- Orders -> Order Items: One-to-many
- Orders -> Deliveries: One-to-one
- Email Accounts -> Orders: One-to-many

### Key Indexes
- User lookups: `clerk_id` for auth integration
- Order queries: `user_id`, `status`, `order_date` for filtering
- Tracking lookups: `tracking_number` for quick access
- Performance: Composite indexes for common query patterns

## 7. DEPLOYMENT

### Vercel Deployment Steps
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Set Node.js version to 18.x
5. Deploy with automatic CI/CD

### Environment Variables for Production
```env
# Production URLs
NEXT_PUBLIC_APP_URL=https://whatdidishop.com
GOOGLE_REDIRECT_URI=https://whatdidishop.com/api/auth/google/callback
MICROSOFT_REDIRECT_URI=https://whatdidishop.com/api/auth/microsoft/callback

# Production API Keys (use production keys, not test keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Database (use production Supabase project)
NEXT_PUBLIC_SUPABASE_URL=https://[prod-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Enable Sentry in production
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

### Monitoring Setup
1. Configure Sentry for error tracking
2. Set up Vercel Analytics for performance monitoring
3. Enable Supabase database monitoring
4. Configure uptime monitoring (e.g., Better Uptime)
5. Set up email alerts for critical errors

## 8. FEATURE ROADMAP

### Current Features
- ✅ User authentication with Clerk
- ✅ Basic project structure
- ⏳ Email OAuth integration
- ⏳ Order management CRUD
- ⏳ Email parsing for major retailers
- ⏳ Delivery tracking integration

### Planned Features
**Phase 1 (MVP)**
- Email scanning and parsing
- Manual order entry
- Basic delivery tracking
- Simple spending statistics

**Phase 2 (Enhanced)**
- Real-time tracking updates
- Advanced filtering and search
- Export functionality (CSV, PDF)
- Email notifications
- Dark mode support

**Phase 3 (Advanced)**
- Mobile app (React Native)
- Browser extension for order capture
- Price drop alerts
- Warranty tracking
- Multi-currency support
- Team/family accounts

### Known Limitations
- Currently supports only Dutch retailers initially
- Email parsing accuracy depends on retailer format consistency
- Tracking API rate limits may delay updates
- No offline support in initial version

## 9. TROUBLESHOOTING

### Common Issues and Solutions

#### Authentication Issues
**Problem**: Users can't sign in with Google/Microsoft
**Solution**: 
- Verify OAuth redirect URIs match environment
- Check Clerk dashboard for proper provider configuration
- Ensure cookies are enabled in browser

#### Email Scanning Failures
**Problem**: Emails not being detected
**Solution**:
- Check email account permissions
- Verify API credentials are valid
- Look for rate limiting errors
- Check parser patterns match email format

#### Database Connection Errors
**Problem**: "Cannot connect to database"
**Solution**:
- Verify Supabase URL and keys
- Check network connectivity
- Ensure RLS policies allow access
- Review connection pool limits

#### Deployment Failures
**Problem**: Build fails on Vercel
**Solution**:
- Check Node.js version compatibility
- Verify all environment variables are set
- Review build logs for missing dependencies
- Ensure database migrations have run

### FAQ Section

**Q: How often are emails scanned?**
A: Emails are scanned every 15 minutes automatically, or can be triggered manually.

**Q: Is my email data secure?**
A: Yes, we use OAuth for authentication, encrypt tokens, and never store email passwords.

**Q: Can I add orders manually?**
A: Yes, you can add orders manually and upload receipts through the dashboard.

**Q: Which retailers are supported?**
A: Currently Bol.com, Coolblue, Zalando, and Amazon. More retailers are being added.

**Q: How accurate is delivery tracking?**
A: Tracking accuracy depends on carrier API data. We update tracking info every hour.

**Q: Can I export my data?**
A: Yes, you can export orders as CSV or request a full data export for GDPR compliance.

**Q: Is there a mobile app?**
A: The web app is mobile-responsive. Native apps are planned for the future.

**Q: How do I delete my account?**
A: You can delete your account in Settings, which will remove all associated data.