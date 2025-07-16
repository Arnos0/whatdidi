# WhatDidiShop Email Parsing System - Technical Deep Dive

## Overview

WhatDidiShop is an automated purchase tracking system that connects to users' Gmail accounts to scan for order confirmation emails, extract purchase details, and create a centralized order database. The system uses AI (recently migrated from Claude to Gemini) to intelligently parse emails from various retailers.

## Table of Contents
1. [Gmail Integration](#gmail-integration)
2. [Email Processing Pipeline](#email-processing-pipeline)
3. [AI Integration with Gemini](#ai-integration-with-gemini)
4. [Current Issues & Solutions](#current-issues--solutions)
5. [Debugging Guide](#debugging-guide)
6. [Future Improvements](#future-improvements)

## Gmail Integration

The system connects to Gmail using OAuth 2.0:
- Users authenticate via Google OAuth
- Access and refresh tokens are encrypted and stored in the database
- The `GmailService` class handles all Gmail API interactions

```typescript
// Email search - fetches ALL emails in date range (no filtering)
const searchResult = await gmail.searchOrderEmails(dateRange)
// Returns up to 5000 emails per scan for comprehensive coverage
```

## Email Processing Pipeline

### 1. Email Fetching & Content Extraction

The `GmailService.extractContent()` method handles complex email structures:

```typescript
// From lib/email/gmail-service.ts
static extractContent(message: GmailMessage): {
  subject: string
  from: string
  date: Date
  htmlBody: string
  textBody: string
  attachments: Array<{ filename: string; mimeType: string; size: number }>
}
```

**Key improvements implemented**:
- **Prioritizes plain text over HTML** - Much cleaner for AI parsing
- **Decodes quoted-printable encoding** - Handles `=3D` → `=`, `=E2=82=AC` → `€`
- **Properly handles MIME multipart messages**
- **Supports Dutch special characters** (é, ë, ï, etc.)

Example of quoted-printable decoding:
```typescript
private static decodeQuotedPrintable(str: string): string {
  // Handle common sequences
  const replacements: Record<string, string> = {
    '=3D': '=',
    '=E2=82=AC': '€', // Euro symbol
    '=C3=A9': 'é',
    // ... more mappings
  }
}
```

### 2. Pre-filtering (AI Email Classifier)

Before sending emails to expensive AI APIs, we pre-filter to reduce costs:

```typescript
// From lib/email/ai-parser.ts
export class AIEmailClassifier {
  static classify(email: GmailMessage) {
    // Quick reject patterns
    const rejectPatterns = [
      'unsubscribe', 'newsletter', 'marketing', 
      'linkedin', 'twitter', 'password reset',
      'job alert', 'vacature'
    ]
    
    // Retailer detection patterns
    const retailPatterns = [
      // Retailers
      'bol.com', 'coolblue', 'zalando', 'amazon',
      // Order keywords
      'bestelling', 'order', 'verzending', 'shipping',
      'bezorging', 'delivery', 'track', 'pakket'
    ]
  }
}
```

**Special Coolblue handling**:
```typescript
// Always force AI analysis for Coolblue due to detection issues
if (from.toLowerCase().includes('coolblue')) {
  console.log(`COOLBLUE EMAIL DETECTED: "${subject}" from ${from}`)
  return true
}
```

### 3. AI Analysis with Gemini

We migrated from Claude to Gemini 2.0 Flash for significant improvements:

| Metric | Claude | Gemini |
|--------|--------|---------|
| Speed | 30 emails/min | 200+ emails/min |
| Cost | $0.003/email | $0.00007/email |
| Rate Limits | Severe (40k tokens/min) | None |
| Batch Size | 3 emails | 20 emails |

#### The Gemini Prompt

```typescript
const prompt = `Analyze this email. If it's an order (purchase confirmation/shipping/delivery), extract:
- orderNumber (look for: bestelnummer, ordernummer, order number, order #)
- retailer (from sender email domain or company name)
- amount & currency (look for: totaal, total, bedrag, EUR, €)
- orderDate (ISO format)
- status (confirmed/shipped/delivered)
- estimatedDelivery (look for: bezorging, levering, delivery)
- trackingNumber & carrier (if present)
- items array with name, quantity, price (if detailed)
- confidence (0-1)

IMPORTANT for Dutch emails:
- "bestelnummer" = order number (may also be in subject after colon)
- "totaal" or "totaalbedrag" = total amount
- "bezorging" or "levering" = delivery
- Currency is usually EUR (€)
- For Coolblue: look for price after "€" symbol
- If you can't find exact order details, look harder in the email body

Return ONLY valid JSON:
{"isOrder": true/false, "orderData": {...}, "debugInfo": {"language": "xx", "emailType": "..."}}

Email:
${emailText.substring(0, 10000)}` // Increased from 5000 to 10000 chars
```

#### Processing Flow in scan/route.ts

```typescript
// 1. Prepare emails for AI (prioritize plain text)
const emailsForAI = emailsToAnalyze.map(email => {
  const { subject, from, date, htmlBody, textBody } = GmailService.extractContent(email)
  let body = textBody || htmlBody || '' // Plain text preferred!
  
  return {
    id: email.id,
    subject,
    from,
    date,
    body: body.substring(0, 10000)
  }
})

// 2. Batch analysis with Gemini
const batchResults = await aiService.batchAnalyzeEmails(emailsForAI)

// 3. Property mapping (AI returns camelCase, DB uses snake_case)
if (result && result.isOrder && result.orderData) {
  // Map 'confirmed' status to 'pending' (DB constraint)
  const mappedStatus = result.orderData.status === 'confirmed' 
    ? 'pending' 
    : result.orderData.status
    
  aiResults.set(email.id, {
    order_number: result.orderData.orderNumber,  // camelCase → snake_case
    retailer: result.orderData.retailer,
    amount: result.orderData.amount,
    currency: result.orderData.currency,
    order_date: result.orderData.orderDate,
    status: mappedStatus || 'pending',
    // ... more mappings
  })
}
```

### 4. Data Validation & Transformation

Several critical transformations ensure data integrity:

#### Dutch Number Format Handling
```typescript
// Gemini returns amounts as strings with Dutch formatting
if (typeof parsedResult.orderData.amount === 'string') {
  // "89,99" → 89.99
  parsedResult.orderData.amount = parseFloat(
    parsedResult.orderData.amount.replace(',', '.')
  )
}
```

#### Status Mapping
```typescript
// Database constraint only allows these statuses:
// 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
// But Gemini returns 'confirmed' for new orders
const mappedStatus = result.orderData.status === 'confirmed' ? 'pending' : result.orderData.status
```

#### Coolblue Order Number Generation
```typescript
// Coolblue sometimes missing order numbers in certain emails
if (!parsedOrder.order_number && isCoolblue) {
  parsedOrder.order_number = `COOLBLUE-${date.getTime()}`
  console.log(`Generated order number for Coolblue: ${parsedOrder.order_number}`)
}
```

## Current Issues & Solutions

### 1. The Coolblue Problem

**Issue**: Coolblue orders weren't being detected despite clear information in emails.

**Example Coolblue email (plain text)**:
```
Hoi Arno,
Je bestelling (90276634) is gelukt!
...
Totaal € 85,00
```

**Root causes discovered**:
1. **HTML vs Plain Text**: HTML version was being sent to AI instead of cleaner plain text
2. **Encoding Issues**: Quoted-printable encoding wasn't decoded (`=E2=82=AC` instead of `€`)
3. **Truncation**: Email body was cut at 5000 chars, missing crucial data
4. **Property Mismatch**: AI returns `orderNumber`, code expected `order_number`
5. **Status Mismatch**: AI returns `confirmed`, DB constraint rejects it

**Solutions implemented**:
- Prioritize plain text extraction
- Implement quoted-printable decoder
- Increase body limit to 10000 chars
- Add property name mapping
- Map 'confirmed' → 'pending'

### 2. Database Constraints

The orders table has strict requirements:
```sql
CREATE TABLE orders (
  -- ...
  status TEXT DEFAULT 'pending', 
  -- CHECK constraint: only 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  -- ...
  UNIQUE(user_id, order_number, retailer) -- Prevents duplicates
);
```

### 3. AI Parsing Inconsistencies

**Gemini behaviors observed**:
- Returns `amount` as string instead of number
- Sometimes returns `null` for clearly visible amounts
- Struggles with complex HTML structures
- Better with plain text than HTML

## Debugging Guide

### Essential Debug Points

1. **Check email content being sent to AI**:
```typescript
// Added in scan/route.ts
if (from.toLowerCase().includes('coolblue')) {
  console.log(`\n=== COOLBLUE EMAIL DEBUG ===`)
  console.log(`Subject: "${subject}"`)
  console.log(`Has textBody: ${!!textBody} (${textBody.length} chars)`)
  console.log(`Plain text preview:`, textBody.substring(0, 1000))
}
```

2. **Monitor AI responses**:
```typescript
// In gemini-service.ts
if (emailContent.from.toLowerCase().includes('coolblue')) {
  console.log(`Gemini response for Coolblue email "${emailContent.subject}":`)
  console.log(`  Raw orderData:`, JSON.stringify(parsedResult.orderData))
}
```

3. **Track order creation**:
```bash
tail -f /tmp/nextjs.log | grep -E "(AI found order|Created order|Failed to create)"
```

### Common Issues & Fixes

| Issue | Symptom | Fix |
|-------|---------|-----|
| No orders created | "0 orders found" | Check email content extraction |
| Database errors | "violates constraint" | Check status values, duplicates |
| Missing amounts | amount: null | Ensure plain text is used |
| Wrong encoding | =E2=82=AC in logs | Quoted-printable decoder |

## Future Improvements

### 1. Hybrid Parsing Approach
```typescript
// Combine regex patterns with AI for reliability
class HybridParser {
  // First: Try regex for known patterns
  static parseWithRegex(email: Email): ParseResult | null {
    const patterns = {
      coolblue: /bestelling \((\d+)\).*?Totaal.*?€\s*([\d,]+)/s,
      bol: /Bestelnummer:\s*(\w+).*?Totaal.*?€\s*([\d,]+)/s
    }
  }
  
  // Second: Fall back to AI if regex fails
  static parseWithAI(email: Email): ParseResult {
    return aiService.analyzeEmail(email)
  }
}
```

### 2. Template Learning System
- Store successful parse patterns per retailer
- Build confidence scores based on historical accuracy
- Use for pre-filtering and validation

### 3. Enhanced HTML Processing
- Better HTML-to-text conversion preserving table structures
- Extract data from HTML tables directly
- Handle inline CSS that hides/shows content

### 4. Multi-Stage AI Processing
```typescript
// If initial parse fails, try focused prompts
if (!result.orderData.amount) {
  const focusedPrompt = `Find the total amount in this email. 
    Look for: totaal, total, bedrag, or currency symbols like €`
  const amountResult = await analyzeWithFocus(email, focusedPrompt)
}
```

### 5. Retailer-Specific Configurations
```typescript
const retailerConfigs = {
  coolblue: {
    orderNumberPatterns: [/bestelling \((\d+)\)/, /ordernummer:\s*(\d+)/],
    requiredFields: ['amount'], // Don't require order_number
    statusMapping: { 'confirmed': 'pending' }
  }
}
```

## File Structure

```
/app/api/email-accounts/[id]/scan/route.ts  # Main scanning endpoint
/lib/email/
  ├── gmail-service.ts      # Gmail API, content extraction, decoding
  └── ai-parser.ts          # Pre-filtering, classification
/lib/ai/
  ├── gemini-service.ts     # Gemini integration, prompt, parsing
  └── ai-service.ts         # AI service abstraction layer
```

## Testing & Monitoring

### Local Testing
```bash
# Start dev server on port 3002
./start-dev.sh

# Monitor logs during scan
tail -f /tmp/nextjs.log | grep -i coolblue

# Check database state
npx tsx scripts/check-coolblue-db.ts
```

### Key Metrics to Track
- Emails processed per second
- AI analysis success rate
- Orders created vs emails analyzed
- Cost per order created
- Parse confidence scores

## Conclusion

The email parsing system has evolved significantly, especially for handling Dutch retailers like Coolblue. The migration from Claude to Gemini provided massive performance improvements, but revealed new challenges in data extraction consistency. The current implementation successfully handles most cases through careful data transformation and validation, but there's room for improvement through hybrid parsing approaches and retailer-specific optimizations.