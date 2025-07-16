# Simple Scan Mode

Due to rate limits and performance issues, here's a temporary solution:

## Quick Fix: Scan Smaller Date Ranges

Instead of scanning 2 weeks or 1 month at once, try:
1. **Last Week** - Should find ~100-200 emails
2. Process in smaller batches

## Manual Test Mode

Use this curl command to test with a specific date range:

```bash
# Scan just the last 3 days
curl -X POST http://localhost:3002/api/email-accounts/99a22a1f-ea85-4008-8df0-a9a3e2606f04/scan \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{"dateRange": "1_week", "scanType": "incremental"}'
```

## Why It's Slow

1. **Token Rate Limits**: 40,000 tokens/minute max
2. **Each email uses ~1,500 tokens** (prompt + response)
3. **Can only process ~25 emails/minute safely**
4. **404 emails = ~16 minutes minimum**

## Permanent Solutions

1. **Upgrade Anthropic Plan** for higher rate limits
2. **Use GPT-3.5-Turbo** for initial filtering (cheaper/faster)
3. **Implement background job queue** (Redis/BullMQ)
4. **Cache processed emails** to avoid re-scanning

## Current Workaround

The scan now has:
- Better error handling
- Won't get stuck anymore
- Shows real progress
- Completes even if some emails fail

Try scanning "Last Week" instead of longer periods!