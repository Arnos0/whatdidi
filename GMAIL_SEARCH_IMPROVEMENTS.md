# Gmail Search Improvements Needed

## Current Issue
- Only finding 81 emails for 2 weeks when there should be hundreds
- Gmail search might be too restrictive or not returning all results

## Improvements Made
1. **Broader Keywords** - Added more keywords like shipping, delivery, package
2. **Simplified Query** - Removed parentheses and complex OR syntax
3. **Better Pagination** - Already fetching all pages up to 5000 emails

## Possible Causes

### 1. Gmail Search Limitations
- Gmail search doesn't search email body by default, only subject/from/to
- Need to be more explicit about what to search

### 2. Language Issues  
- Dutch emails might use different terms
- Need more Dutch keywords

### 3. Query Syntax
- Complex OR queries might not work as expected
- Gmail might have a different syntax

## Recommendations

### Try Different Approaches:

1. **Search by sender domain** instead of keywords:
   ```
   from:bol.com OR from:coolblue.nl OR from:amazon
   ```

2. **Search email categories**:
   ```
   category:purchases OR category:promotions
   ```

3. **Search by label** if available:
   ```
   label:orders OR label:receipts
   ```

4. **Use Gmail's built-in filters**:
   ```
   is:important has:attachment
   ```

### Next Steps

1. Run the test endpoint to see how many emails exist without filters
2. Try different query combinations
3. Consider allowing users to customize search terms
4. Add more retailer-specific searches

The key is that Gmail search is quite limited compared to full-text search. We need to be strategic about our queries.