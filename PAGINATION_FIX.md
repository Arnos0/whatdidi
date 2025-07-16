# Gmail Search Pagination Fix

## Problem
Gmail API was only returning 210 emails when there should be ~2000. This was because:
1. Gmail API limits each request to max 500 results
2. We weren't using pagination to get all results
3. We were re-processing already scanned emails

## Solutions Implemented

### 1. Full Pagination Support
```javascript
// Now fetches ALL emails using nextPageToken
do {
  const result = await this.listMessages({
    query,
    dateRange,
    maxResults: 500,
    pageToken
  })
  allMessages = allMessages.concat(result.messages)
  pageToken = result.nextPageToken
} while (pageToken && allMessages.length < 5000)
```

### 2. Skip Already Processed Emails
- Checks database for previously processed emails
- Only fetches and processes new emails
- Significantly faster for subsequent scans

### 3. Improved Search Query
- Simplified keywords for better matching
- Focus on key terms: order, bestelling, factuur, invoice, receipt
- Direct retailer names: bol.com, coolblue, amazon

### 4. Better Progress Tracking
Shows:
- "Fetched X messages so far (estimated total: Y)..."
- "Found X already processed emails"
- "Need to process X new emails"

## Expected Results

Now when you scan:
1. **Initial scan**: Will find ALL matching emails (likely 2000+)
2. **Subsequent scans**: Will only process new emails
3. **Progress**: Clear feedback throughout the process
4. **Performance**: 
   - First scan: ~10-20 minutes for 2000 emails
   - Later scans: Much faster (only new emails)

## Rate Limiting Protection

Still includes:
- 5 concurrent requests max
- 1-second delays between batches
- Automatic retry on rate limits
- Progress saved as it goes

## Try Again!

Run another scan - it should now find all your emails!