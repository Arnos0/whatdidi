# WhatDidiShop Development Plan

## Overview
This document tracks the development progress of WhatDidiShop, a purchase tracking web application. Each task is designed to be simple and incremental, following the principle of making minimal changes at each step.

## Development Phases

### Phase 1: Foundation Setup ✅
- [x] Create project structure and configuration files
- [x] Create claude.md documentation
- [x] Create this todo.md plan
- [x] Set up basic Next.js app structure
- [x] Configure Tailwind CSS and global styles
- [x] Create layout components

### Phase 2: Authentication Setup
- [ ] Install and configure Clerk
- [ ] Create sign-in page with Clerk components
- [ ] Create sign-up page with Clerk components
- [ ] Add middleware for route protection
- [ ] Create basic dashboard layout
- [ ] Test authentication flow

### Phase 3: Database Setup
- [ ] Create Supabase project
- [ ] Design and create database schema
- [ ] Create migration files
- [ ] Set up Supabase client
- [ ] Create type definitions from schema
- [ ] Implement basic RLS policies

### Phase 4: Core UI Components
- [ ] Create Button component
- [ ] Create Card component
- [ ] Create Input components
- [ ] Create Modal/Dialog component
- [ ] Create Toast notification system
- [ ] Create Loading states

### Phase 5: Landing Page
- [ ] Create hero section
- [ ] Add feature sections
- [ ] Create pricing table
- [ ] Add email capture form
- [ ] Implement responsive design
- [ ] Add animations

### Phase 6: Dashboard Layout
- [ ] Create dashboard navigation
- [ ] Implement dashboard sidebar
- [ ] Create dashboard header
- [ ] Add user menu dropdown
- [ ] Create empty state components
- [ ] Implement dark mode toggle

### Phase 7: Order Management - Read
- [ ] Create orders API route (GET)
- [ ] Implement useOrders hook
- [ ] Create OrderList component
- [ ] Add pagination
- [ ] Implement search functionality
- [ ] Add filters (status, date range)

### Phase 8: Order Management - Create
- [ ] Create manual order form
- [ ] Add form validation with Zod
- [ ] Create orders API route (POST)
- [ ] Implement file upload for receipts
- [ ] Add success/error handling
- [ ] Update order list after creation

### Phase 9: Order Details
- [ ] Create order detail API route
- [ ] Create OrderDetail component
- [ ] Display order items
- [ ] Show delivery tracking info
- [ ] Add order timeline
- [ ] Implement edit functionality

### Phase 10: Email Integration - OAuth
- [ ] Set up Google OAuth credentials
- [ ] Implement Gmail OAuth flow
- [ ] Set up Microsoft OAuth credentials
- [ ] Implement Outlook OAuth flow
- [ ] Store encrypted tokens
- [ ] Create email accounts management UI

### Phase 11: Email Parsing - Core
- [ ] Create email fetching service
- [ ] Implement base email parser class
- [ ] Create retailer detection logic
- [ ] Build email preview component
- [ ] Add parsing test interface
- [ ] Implement error handling

### Phase 12: Email Parsing - Retailers
- [ ] Create Bol.com parser
- [ ] Create Coolblue parser
- [ ] Create Zalando parser
- [ ] Create Amazon parser
- [ ] Add parser tests
- [ ] Implement fallback parsing

### Phase 13: Background Jobs
- [ ] Set up background job infrastructure
- [ ] Create email scanning job
- [ ] Implement job scheduling (15 min)
- [ ] Add job status tracking
- [ ] Create manual scan trigger
- [ ] Add scan history UI

### Phase 14: Delivery Tracking - Core
- [ ] Create tracking API structure
- [ ] Implement unified tracking model
- [ ] Create carrier detection logic
- [ ] Build tracking UI component
- [ ] Add tracking timeline
- [ ] Implement status mapping

### Phase 15: Delivery Tracking - Carriers
- [ ] Integrate PostNL API
- [ ] Integrate DHL API
- [ ] Integrate DPD API
- [ ] Add tracking webhook support
- [ ] Implement tracking updates
- [ ] Create tracking notifications

### Phase 16: Statistics & Analytics
- [ ] Create statistics API endpoints
- [ ] Build spending overview widget
- [ ] Add monthly spending chart
- [ ] Create retailer breakdown
- [ ] Add delivery statistics
- [ ] Implement date range selector

### Phase 17: User Settings
- [ ] Create settings page layout
- [ ] Add email account management
- [ ] Implement notification preferences
- [ ] Add data export functionality
- [ ] Create account deletion flow
- [ ] Add API key management

### Phase 18: Performance & Polish
- [ ] Implement React Query caching
- [ ] Add optimistic updates
- [ ] Create error boundaries
- [ ] Add Sentry integration
- [ ] Implement lazy loading
- [ ] Optimize bundle size

### Phase 19: Testing & Documentation
- [ ] Write unit tests for parsers
- [ ] Add integration tests
- [ ] Create API documentation
- [ ] Write user guide
- [ ] Add inline help tooltips
- [ ] Create video tutorials

### Phase 20: Deployment & Launch
- [ ] Set up Vercel project
- [ ] Configure production env vars
- [ ] Run production build
- [ ] Set up domain
- [ ] Configure monitoring
- [ ] Launch MVP

## Current Status
**Phase**: 1 - Foundation Setup ✅ COMPLETED
**Progress**: Phase 1 fully completed. Ready to proceed with Phase 2 - Authentication Setup.

## Development Guidelines
1. Each task should be completable in 15-30 minutes
2. Test each feature before marking as complete
3. Commit after each completed phase
4. Keep changes minimal and focused
5. Document any deviations from the plan

## Notes
- Priority is on getting a working MVP quickly
- Email parsing accuracy can be improved iteratively
- Start with manual order entry to provide immediate value
- Tracking integration can be basic initially

## Review Section
*To be completed after implementation*

---

Last Updated: [Current Date]
Next Step: Await user approval of this plan