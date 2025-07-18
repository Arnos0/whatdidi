# WhatDidiShop Development Plan - n8n MVP Edition

> **📋 MVP PIVOT**: Simplified approach using n8n for manual entry and email forwarding  
> **🌍 LANGUAGES**: English (en) and Dutch (nl) only for MVP  
> **📅 UPDATED**: 2025-01-18

## Overview
This document tracks the development progress of WhatDidiShop MVP. We're pivoting to a simplified approach that uses n8n for data ingestion (manual order entry + email forwarding) while postponing full OAuth email scanning to Phase 2.

## Strategic Vision - MVP
- **n8n-First Approach**: Leverage n8n cloud for order data ingestion
- **Language Focus**: English and Dutch only (drop de/fr for MVP)
- **Existing Schema**: Use current database structure with minimal additions
- **Quick Launch**: Get to market faster with simpler implementation

## MVP Architecture
```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   n8n Cloud     │────▶│  Supabase    │◀────│  Next.js    │
│  (Data Input)   │     │  (Database)  │     │    (UI)     │
└─────────────────┘     └──────────────┘     └─────────────┘
        │                                              │
        ├── Manual Form ──────────────────────────────┤
        └── Email Forward ────────────────────────────┘
```

## Development Phases

### Phase 1: MVP Foundation (n8n Integration) 🚀 CURRENT PRIORITY
**Goal**: Simple order tracking via manual entry and email forwarding

#### 1.1: Documentation Updates ✅ IN PROGRESS
- [x] Update todo.md with new MVP phase structure
- [ ] Update claude.md with n8n integration section
- [ ] Update EMAIL_PARSING_SYSTEM.md for forwarding workflow
- [ ] Create N8N_INTEGRATION.md with detailed setup
- [ ] Create MVP_ARCHITECTURE.md with system design

#### 1.2: Language Simplification (en/nl only) ⏳
- [ ] Update `/lib/ai/language-terms.ts` - Remove de/fr, keep en/nl
- [ ] Simplify `/lib/ai/prompt-builder.ts` - Focus on en/nl prompts
- [ ] Update `/lib/email/utils/multilingual-patterns.ts` - en/nl patterns only
- [ ] Simplify `/lib/email/utils/language-detector.ts` - Binary en/nl detection
- [ ] Remove all German/French patterns from codebase

#### 1.3: Database Preparation ⏳
- [ ] Verify existing schema has required columns:
  - [ ] `orders.is_manual` (boolean, default false)
  - [ ] `orders.needs_review` (boolean, default false) 
  - [ ] `orders.raw_email_data` (jsonb)
- [ ] Update TypeScript types in `/lib/types/database.ts`
- [ ] Create helper functions for new fields
- [ ] Add indexes if needed for performance

#### 1.4: n8n Manual Order Form Workflow ⏳
- [ ] Design webhook endpoint structure
- [ ] Create validation schema for form inputs
- [ ] Document user email verification process
- [ ] Plan Dutch amount transformation (89,99 → 89.99)
- [ ] Design order + order_items insertion flow
- [ ] Create email notification templates
- [ ] Document error handling approach

**Form Fields**:
- `user_email` (required) - verify against users table
- `retailer` (required) - max 100 chars
- `amount` (required) - positive number
- `currency` (optional) - default 'EUR'
- `order_date` (required) - date picker
- `order_number` (optional) - max 100 chars
- `status` (optional) - pending/shipped/delivered
- `tracking_number` (optional)
- `carrier` (optional)
- `estimated_delivery` (optional)
- `receipt_url` (optional) - URL validation
- `items` (optional) - JSON array in textarea

#### 1.5: n8n Email Forwarding Workflow ⏳
- [ ] Configure IMAP for sendto@whatdidi.shop
- [ ] Design 5-minute polling schedule
- [ ] Plan sender verification against users.email
- [ ] Design Gemini API integration
- [ ] Plan fuzzy matching for existing orders
- [ ] Design update vs insert logic
- [ ] Create notification email templates
- [ ] Plan error handling and retry logic

#### 1.6: Gemini Integration Updates ⏳
- [ ] Create focused en/nl prompt template
- [ ] Add Dutch number format parser (1.234,56 → 1234.56)
- [ ] Implement status mapping (en/nl terms → db values)
- [ ] Update confidence scoring logic
- [ ] Handle parsing errors gracefully
- [ ] Test with real en/nl emails

#### 1.7: Application UI Updates ⏳
- [ ] Add "Add Order Manually" button to dashboard
- [ ] Create modal/redirect to n8n form
- [ ] Add email forwarding setup guide
- [ ] Show order source indicator (manual/email icon)
- [ ] Add "Needs Review" badge for low-confidence orders
- [ ] Create review interface for flagged orders
- [ ] Update order detail view with new fields

#### 1.8: Testing & Security ⏳
- [ ] Unit tests for number/date transformations
- [ ] Test n8n webhook integration
- [ ] End-to-end user flow testing
- [ ] Security validation (input sanitization)
- [ ] Rate limiting implementation
- [ ] Error message sanitization
- [ ] Webhook authentication

### Phase 2: Full Email OAuth (Future Enhancement) 📅 POSTPONED
**Note**: This was originally Phase 1 but moved to Phase 2 for MVP simplicity

#### Email Integration - OAuth
- [ ] Keep existing Google OAuth implementation
- [ ] Keep existing Microsoft OAuth implementation  
- [ ] Keep existing token management
- [ ] Keep existing email scanning logic

#### Email Parsing - Advanced
- [ ] Multi-language support (add de/fr back)
- [ ] Advanced retailer detection
- [ ] Batch processing optimization
- [ ] Historical email import

### Phase 3: Post-MVP Enhancements 🔮 FUTURE
- [ ] Mobile app with email forwarding
- [ ] Browser extension for order capture
- [ ] Advanced duplicate detection
- [ ] Bulk import functionality
- [ ] Multi-currency support
- [ ] Team/family accounts
- [ ] API for third-party integrations

## Technical Specifications

### n8n Webhook Security
```javascript
// Webhook URL format
https://n8n.whatdidi.shop/webhook/manual-order?token=SECURE_TOKEN

// Next.js webhook handler
export async function POST(req: Request) {
  const token = req.headers.get('x-webhook-token')
  if (token !== process.env.N8N_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }
  // Process order...
}
```

### Dutch Data Transformations
```typescript
// Amount parser
function parseDutchAmount(amount: string): number {
  // "89,99" → 89.99
  // "1.234,56" → 1234.56
  return parseFloat(
    amount
      .replace(/\./g, '') // Remove thousand separators
      .replace(',', '.')  // Convert decimal comma
  );
}

// Date parser (if needed)
function parseDutchDate(date: string): string {
  // "31-12-2024" → "2024-12-31"
  const [day, month, year] = date.split('-')
  return `${year}-${month}-${day}`
}
```

### Status Mappings
```typescript
const STATUS_MAP = {
  // English
  'confirmed': 'pending',
  'shipped': 'shipped', 
  'delivered': 'delivered',
  'cancelled': 'cancelled',
  // Dutch
  'bevestigd': 'pending',
  'verzonden': 'shipped',
  'geleverd': 'delivered',
  'geannuleerd': 'cancelled'
}
```

## Success Metrics
- Manual order creation time: < 30 seconds
- Email parsing success rate: > 80% (en/nl)
- User adoption rate: > 60%
- Support tickets: < 5% of orders
- Cost per order: < $0.01

## Timeline
- **Week 1**: Documentation, Language Simplification, Database Prep
- **Week 2**: n8n Workflows (Manual + Forwarding)
- **Week 3**: UI Updates, Testing, Launch

## Development Guidelines
1. Keep changes minimal and focused
2. Test each feature thoroughly
3. Document all n8n workflows
4. Maintain backward compatibility
5. Security first approach

## Current Status
**Phase**: 1.1 - Documentation Updates  
**Progress**: Updating documentation for MVP pivot  
**Next**: Language simplification for en/nl only  
**Blockers**: None

## Notes
- n8n cloud instance already set up and ready
- Existing OAuth code remains but unused in MVP
- All database changes are additive (no breaking changes)
- Can switch back to OAuth scanning anytime

---
Last Updated: 2025-01-18  
Next Review: After n8n workflow implementation