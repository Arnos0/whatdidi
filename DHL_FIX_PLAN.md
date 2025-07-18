# DHL Tracking Linking Fix Plan

## Current Issue
- **Problem**: DHL tracking `JVGL0624229100530651` is incorrectly linked to Anthropic order `2485-4998-7056` 
- **Should link to**: The correct Coolblue order instead
- **Additional issue**: Email scanning still hangs at 100/394 emails

## Root Cause Analysis
- **Location**: `/app/api/email-accounts/[id]/scan/route.ts` lines 449-494
- **Issue**: Current logic uses "most recent order without tracking" as fallback
- **Result**: This picks the wrong order (Anthropic) instead of the correct retailer (Coolblue)

## Key Evidence from Logs
```
Line 430: DHL: Linking tracking JVGL0624229100530651 to order 2485-4998-7056 from Anthropic, PBC
```
This should link to a Coolblue order, not Anthropic.

## Fix Strategy

### 1. Improve DHL Order Matching Logic
- Parse DHL email content to extract actual retailer name (likely "Coolblue")
- Look for orders from that specific retailer first before falling back
- Use retailer patterns in DHL parser: "voor [retailer]", "namens [retailer]", etc.

### 2. Enhanced Matching Priority
- ✅ **First**: Find by tracking number (existing logic works)
- 🔧 **Second**: Find by retailer name + recent date range (needs fix)
- 🔧 **Third**: Find by order details if available in DHL email
- 🔧 **Last resort**: Most recent order without tracking (current buggy logic)

### 3. Files to Modify
1. **`/app/api/email-accounts/[id]/scan/route.ts`** - Fix DHL linking logic around lines 449-494
2. **`/lib/email/parsers/retailers/dhl-parser.ts`** - Improve retailer extraction

### 4. Implementation Details
- Improve retailer extraction from DHL tracking emails
- Match DHL tracking to orders from the same retailer
- Add better fallback logic that considers retailer context
- Fix the order matching priority to prevent wrong linkages

### 5. Test Plan
1. Run `fix-stuck-scan.ts` to clear current hung job
2. Test DHL linking with corrected logic
3. Verify scan completes without hanging
4. Confirm DHL tracking links to correct Coolblue order

## Current State
- DHL parser works (confidence 0.7, passes threshold >=0.7)
- DHL emails are being processed but linked to wrong orders
- Scan hangs likely due to this incorrect linking logic

## Next Steps
1. Fix the DHL order matching logic in scan route
2. Test the fix with the problematic tracking number
3. Verify email scanning completes successfully
4. Confirm DHL tracking links to correct orders

---
*Created: 2025-07-16*
*Status: Ready for implementation*