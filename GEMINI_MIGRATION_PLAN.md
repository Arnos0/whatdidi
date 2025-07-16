# Gemini 2.0 Flash Migration Plan

## Priority for Tomorrow: Switch from Claude to Gemini 2.0 Flash

### Why We're Switching
After implementing Claude AI for email parsing, we encountered significant rate limit issues:
- **Token limit**: 40,000 tokens/minute (only ~20-30 emails/minute)
- **Slow processing**: 270 emails took 9+ minutes
- **High cost**: $0.003 per email ($0.81 for 270 emails)
- **Poor UX**: Progress bar stuck at 0 for minutes

### Gemini 2.0 Flash Benefits
- **10x faster**: 200+ emails/minute (vs 30)
- **40x cheaper**: $0.00007 per email (vs $0.003)
- **No rate limits**: 4M tokens/minute, 4000 requests/minute
- **Better UX**: Real-time progress updates

## Implementation Steps

### 1. Get Google AI API Key (5 minutes)
```bash
# Option A: Google AI Studio (Easier)
1. Go to https://aistudio.google.com
2. Create API key
3. Add to .env.local: GOOGLE_AI_API_KEY=your-key

# Option B: Vertex AI (More robust)
1. Create Google Cloud Project
2. Enable Vertex AI API
3. Create service account key
```

### 2. Install Google AI SDK (2 minutes)
```bash
npm install @google/generative-ai
```

### 3. Create Gemini Service (20 minutes)
Create `lib/ai/gemini-service.ts`:
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

export class GeminiService {
  private genAI: GoogleGenerativeAI
  private model: any
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  }
  
  async analyzeEmail(emailContent: {
    subject: string
    from: string
    date: Date
    body: string
  }) {
    // Similar to Claude but with Gemini's format
    const prompt = `Extract order details from this email...`
    const result = await this.model.generateContent(prompt)
    return JSON.parse(result.response.text())
  }
  
  // Batch processing - can handle 20-30 emails at once!
  async batchAnalyzeEmails(emails: Array<...>) {
    // Process in larger batches with Gemini's higher limits
  }
}
```

### 4. Update AI Parser (10 minutes)
In `lib/email/ai-parser.ts`:
- Replace `claudeService` with `geminiService`
- Increase batch sizes (3→20 emails)
- Remove rate limit delays

### 5. Update Scan Route (10 minutes)
In `app/api/email-accounts/[id]/scan/route.ts`:
- Increase batch size (10→50)
- Remove artificial delays
- Update cost calculations

### 6. Test & Optimize (20 minutes)
- Test with 270 emails
- Should complete in 1-2 minutes
- Monitor for any errors
- Fine-tune batch sizes

## Expected Results

### Performance Comparison
| Metric | Claude (Current) | Gemini 2.0 Flash |
|--------|-----------------|------------------|
| Speed | 30 emails/min | 200+ emails/min |
| 270 emails | 9 minutes | 1.5 minutes |
| Cost | $0.81 | $0.02 |
| Rate limits | Severe | None |
| Progress updates | Stuck at 0 | Real-time |

### Cost Comparison (Monthly)
- Claude: ~$25/month (1000 emails/day)
- Gemini: ~$0.60/month (1000 emails/day)

## Quick Start Tomorrow

1. **Get API Key** (5 min)
   ```bash
   # Add to .env.local
   GOOGLE_AI_API_KEY=your-key-here
   ```

2. **Install SDK** (2 min)
   ```bash
   npm install @google/generative-ai
   ```

3. **Copy Claude service structure** (20 min)
   - Same interface, different implementation
   - Adjust for Gemini's API format

4. **Test** (10 min)
   - Run email scan
   - Watch it complete in <2 minutes!

## Notes for Implementation

- Gemini uses different prompt format than Claude
- Response is already JSON (set responseMimeType)
- Can process much larger batches
- No need for token counting
- Built-in retry logic

## Backup Plan

If Gemini doesn't work well:
1. Try OpenAI GPT-3.5-turbo (also fast/cheap)
2. Use Gemini for filtering, Claude for parsing
3. Implement caching to reduce API calls

## Success Metrics

- [ ] 270 emails processed in <2 minutes
- [ ] Cost <$0.05 per scan
- [ ] Real-time progress updates
- [ ] No rate limit errors
- [ ] 95%+ order detection accuracy

---

**Tomorrow's first task: Get Google AI API key and implement GeminiService!**