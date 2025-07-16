# AI-Powered Email Parsing Implementation

## Overview
We've replaced the brittle custom parser system with an AI-powered universal parser using Claude. This approach handles all languages and retailers without custom code.

## Key Benefits
1. **Universal Language Support** - Works with Dutch, English, French, Spanish, German, and more
2. **Zero Maintenance** - No regex patterns to update when retailers change formats
3. **Instant Scaling** - Works with ANY retailer without writing new code
4. **High Accuracy** - AI understands context and nuance like humans do
5. **Cost Effective** - ~$0.003 per email analyzed

## Architecture

### Components
1. **Claude Service** (`lib/ai/claude-service.ts`)
   - Handles communication with Anthropic's Claude API
   - Analyzes emails and extracts structured order data
   - Supports batch processing for efficiency

2. **AI Email Parser** (`lib/email/ai-parser.ts`)
   - Universal parser that replaces all retailer-specific parsers
   - Pre-filters emails to optimize API usage
   - Cleans and prepares email content for AI analysis

3. **Updated Scan Route** (`app/api/email-accounts/[id]/scan/route.ts`)
   - Uses AI parser instead of parser registry
   - Tracks API usage and estimates costs
   - Handles all retailers with one code path

## Setup

### 1. Get Anthropic API Key
1. Sign up at https://console.anthropic.com
2. Generate an API key (starts with `sk-ant-`)
3. Add to your `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

### 2. Test the Implementation
```bash
# Test AI parser with sample emails
curl http://localhost:3002/api/test/ai-parser

# Run a real email scan
curl -X POST http://localhost:3002/api/email-accounts/{id}/scan \
  -H "Content-Type: application/json" \
  -d '{"dateRange": "1_week", "scanType": "incremental"}'
```

## How It Works

### 1. Email Pre-filtering
Before sending to AI, emails are checked for order-related keywords in multiple languages:
- English: order, confirmation, receipt, shipping, delivery
- Dutch: bestelling, bevestiging, factuur, verzending
- French: commande, confirmation, livraison
- German: bestellung, bestätigung, versand
- Spanish: pedido, confirmación, envío

### 2. AI Analysis
Claude analyzes emails with:
- Language detection
- Order information extraction
- Confidence scoring
- Multi-currency support
- Item detail parsing

### 3. Structured Output
AI returns structured JSON with:
```json
{
  "isOrder": true,
  "orderData": {
    "orderNumber": "12345678",
    "retailer": "Bol.com",
    "amount": 123.45,
    "currency": "EUR",
    "orderDate": "2025-07-15T10:00:00Z",
    "status": "confirmed",
    "items": [...],
    "confidence": 0.95
  },
  "debugInfo": {
    "language": "nl",
    "emailType": "order_confirmation"
  }
}
```

## Cost Management

### Pricing
- Claude 3.5 Sonnet: ~$0.003 per email
- 1,000 emails ≈ $3.00
- 10,000 emails ≈ $30.00

### Optimization Strategies
1. **Pre-filtering** - Only analyze emails likely to be orders
2. **Caching** - Don't re-analyze already processed emails
3. **Batch Processing** - Process multiple emails efficiently
4. **Incremental Scans** - Only process new emails

### Cost Tracking
The scan job tracks AI usage and displays estimated costs:
```
Scan completed: 250 emails analyzed by AI, estimated cost: $0.75
```

## Troubleshooting

### No Orders Found
1. Check ANTHROPIC_API_KEY is set correctly
2. Verify emails contain order information
3. Check console logs for AI responses
4. Lower confidence threshold if needed (default: 0.7)

### API Errors
1. Rate limits: Automatic retry with backoff
2. Token limits: Email bodies truncated at 10,000 chars
3. Invalid API key: Check environment variable

### Performance
- Processes ~5 emails per second with rate limiting
- Batch size of 20 to balance speed and reliability
- 1-second delay between batches for API compliance

## Future Enhancements

1. **Multi-model Support**
   - Add OpenAI GPT-4 as fallback
   - Use smaller models for simple emails

2. **Advanced Features**
   - Link related emails (order + shipping + delivery)
   - Extract product images and descriptions
   - Handle refunds and cancellations

3. **Cost Optimization**
   - Local LLM for pre-classification
   - Smarter batching algorithms
   - Result caching and deduplication

## Migration from Old System

The AI system seamlessly replaces the old parser system:
- All existing infrastructure remains unchanged
- Database schema stays the same
- UI continues to work without modification
- Only the parsing logic is replaced

Old parsers can be removed once AI system is validated.