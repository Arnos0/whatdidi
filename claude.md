# WhatDidiShop - Development Documentation

## RULES

1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.md file with a summary of the changes you made and any other relevant information.

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

### How to Run Locally
```bash
# Start development server
npm run dev

# Run with debug logging
DEBUG=* npm run dev

# Run with specific port
PORT=3001 npm run dev
```

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
  - page: number
  - limit: number
  - status: 'pending' | 'shipped' | 'delivered'
  - search: string

// Get single order
GET /api/orders/:id

// Create manual order
POST /api/orders
Body: {
  orderNumber: string
  retailer: string
  amount: number
  orderDate: string
  items: OrderItem[]
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