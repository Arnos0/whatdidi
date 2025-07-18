# WhatDidiShop 🛍️

Purchase tracking MVP with n8n integration and AI email parsing.

## 🚨 DEVELOPMENT - READ FIRST! 

**THIS PROJECT USES PORT 3002 - NOT 3000!**

### ✅ Start Development Server
```bash
# RECOMMENDED: No timeout issues
./start-dev.sh

# Alternative (now defaults to 3002)
npm run dev

# Stop server 
./stop-dev.sh
```

### 🎯 Access Application
**http://localhost:3002**

### 📚 Full Documentation
See [claude.md](./claude.md) for complete development guide.

---

## Quick Commands

```bash
# Development
./start-dev.sh          # Start server (port 3002)
./stop-dev.sh           # Stop server
tail -f /tmp/nextjs.log # View logs

# Build & Test
npm run build           # Build for production
npm run lint            # Run linting

# Database
npm run db:migrate      # Run migrations
```

## Tech Stack
- Next.js 14 (App Router)
- TypeScript + Tailwind CSS  
- Clerk (Auth)
- Supabase (Database)
- n8n (Workflow Automation)
- Gemini AI (Email Parsing)

## Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure Clerk, Supabase, n8n variables
3. Run `npm install`
4. Start with `./start-dev.sh`

**For detailed setup see [claude.md](./claude.md)**