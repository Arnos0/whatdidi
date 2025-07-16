# Dutch Email Scanning - Testing Guide

## What Was Implemented

### 1. Enhanced Gmail Search
The system now uses a multi-strategy approach to find Dutch order emails:

**Strategy 1: Direct Retailer Search**
- Searches emails from 20+ Dutch retailers directly: bol.com, coolblue.nl, zalando.nl, amazon.nl, mediamarkt.nl, ah.nl, jumbo.com, etc.
- Most accurate method - targets known retailers

**Strategy 2: Dutch Keywords**
- Searches for Dutch order terms: bestelling, bezorging, verzending, pakket, factuur
- Catches emails from retailers not in our list

**Strategy 3: Smart Exclusions**
- Excludes server/system emails with: -subject:"server" -subject:"backup" -from:noreply@
- Prevents false positives from "package update" emails

### 2. New Retailer Parsers
Created specialized parsers for major Dutch retailers:

**Coolblue Parser** (`/lib/email/parsers/retailers/coolblue-parser.ts`):
- Handles Coolblue's specific email format
- Extracts order numbers, amounts, delivery dates
- Recognizes Dutch keywords in Coolblue emails

**Zalando Parser** (`/lib/email/parsers/retailers/zalando-parser.ts`):
- Supports both Dutch and English Zalando emails  
- Handles Zalando's order number format (xxxx-xxxx-xxxx)
- Extracts item details and delivery windows

### 3. Dutch Language Support

**Currency Handling**:
- Dutch format: €1.234,56 (dots for thousands, comma for decimal)
- International format: €1,234.56 (commas for thousands, dot for decimal)
- Both formats are now supported

**Date Parsing**:
- Dutch months: januari, februari, maart, etc.
- Dutch date formats: 15 januari 2024
- Various formats: DD-MM-YYYY, DD/MM/YYYY

## Testing Instructions

### 1. Start Fresh Test
```bash
# Clear any previously processed emails (optional)
# This allows a clean test of the new search

# Run email scan
1. Go to Settings
2. Click on your Gmail account
3. Choose "Last month" or "Last 2 weeks"
4. Click "Scan Emails"
```

### 2. Expected Results

**Before** (English-focused system):
- Found: ~200 emails (mostly "package updates")
- Recognized: Only Bol.com
- Parsed: 0-3 orders

**After** (Dutch-optimized system):
- Should find: 500+ order emails
- Should recognize: Bol.com, Coolblue, Zalando, Amazon.nl, MediaMarkt, etc.
- Should parse: Orders with amounts, dates, and items

### 3. Check the Logs

In the browser console or server logs, you should see:
```
Gmail search query: (from:bol.com OR from:coolblue.nl OR ...) OR (bestelling OR bezorging OR ...) -subject:"server" ...
Fetched 500 messages so far (estimated total: 2000)...
Processing retailer: Coolblue
Parsed order: #1234567890, €123.45
```

### 4. Verify Results

After scanning:
1. Check the Orders page - should show parsed orders
2. Look for various retailers (not just "unknown")
3. Verify amounts are correctly parsed (Dutch currency format)
4. Check that delivery dates are extracted

## Troubleshooting

### Still seeing few emails?
1. Check date range - try "Last 3 months"
2. Verify Gmail API permissions are correct
3. Check if emails are in Spam/Trash folders

### Orders showing as "unknown" retailer?
- The email is from a retailer we don't have a parser for yet
- Check which retailers are missing and we can add parsers

### Rate limiting errors?
- Normal for large mailboxes
- The system will retry automatically
- Scanning may take a few minutes for 1000+ emails

## Next Steps

If you find retailers that aren't being recognized:
1. Note the retailer name and email domain
2. We can quickly add new parsers following the Coolblue/Zalando pattern
3. Each parser takes ~10 minutes to implement

The system is now optimized for Dutch online shopping emails!