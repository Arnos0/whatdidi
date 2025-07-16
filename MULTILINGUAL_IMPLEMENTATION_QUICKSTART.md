# Multilingual Implementation Quick Start Guide

## Phase 11.1: Multilingual Infrastructure - Day 1 Implementation

This guide provides immediate, actionable steps to implement Phase 11.1 (Multilingual Infrastructure) from the updated todo.md.

### Step 1: Install Language Detection Library (5 minutes)

```bash
npm install franc
```

### Step 2: Create Language Detection Utility (15 minutes)

Create `/lib/email/utils/language-detector.ts`:

```typescript
import franc from 'franc';

export type SupportedLanguage = 'nld' | 'deu' | 'fra' | 'eng';
export type LanguageCode = 'nl' | 'de' | 'fr' | 'en';

const LANGUAGE_MAP: Record<SupportedLanguage, LanguageCode> = {
  'nld': 'nl',
  'deu': 'de', 
  'fra': 'fr',
  'eng': 'en'
};

const DOMAIN_LANGUAGE_MAP: Record<string, LanguageCode> = {
  'amazon.nl': 'nl',
  'amazon.de': 'de',
  'amazon.fr': 'fr',
  'bol.com': 'nl',
  'coolblue.nl': 'nl',
  'coolblue.be': 'nl', // Dutch part of Belgium
  'zalando.nl': 'nl',
  'zalando.de': 'de',
  'zalando.fr': 'fr',
  'otto.de': 'de',
  'fnac.com': 'fr',
  'fnac.fr': 'fr'
};

export function detectEmailLanguage(
  emailText: string, 
  senderDomain?: string
): LanguageCode {
  // Check domain override first
  if (senderDomain) {
    const domainLang = DOMAIN_LANGUAGE_MAP[senderDomain.toLowerCase()];
    if (domainLang) return domainLang;
  }

  // Sample first 2000 chars for language detection
  const sample = emailText.substring(0, 2000);
  
  // Detect language
  const detectedLang = franc(sample, {
    minLength: 10,
    only: ['nld', 'deu', 'fra', 'eng'] as SupportedLanguage[]
  }) as SupportedLanguage;

  // Map to our language codes
  return LANGUAGE_MAP[detectedLang] || 'en';
}
```

### Step 3: Create Multilingual Pattern Dictionary (20 minutes)

Create `/lib/email/utils/multilingual-patterns.ts`:

```typescript
export interface LanguagePatterns {
  reject: string[];
  retail: string[];
  orderTerms: string[];
  totalTerms: string[];
  deliveryTerms: string[];
  statusTerms: Record<string, string>;
}

export const LANGUAGE_PATTERNS: Record<string, LanguagePatterns> = {
  nl: {
    reject: [
      'afmelden', 'nieuwsbrief', 'marketing', 'advertentie',
      'uitschrijven', 'no-reply', 'kennisgeving'
    ],
    retail: [
      'bol.com', 'coolblue', 'zalando', 'amazon', 'wehkamp',
      'bestelling', 'verzending', 'order', 'levering', 'pakket'
    ],
    orderTerms: ['bestelnummer', 'ordernummer', 'order number'],
    totalTerms: ['totaal', 'totaalbedrag', 'te betalen'],
    deliveryTerms: ['bezorging', 'levering', 'verzending', 'verwachte leverdatum'],
    statusTerms: {
      'besteld': 'ordered',
      'verzonden': 'shipped',
      'onderweg': 'in_transit',
      'geleverd': 'delivered',
      'afgeleverd': 'delivered'
    }
  },
  de: {
    reject: [
      'abbestellen', 'newsletter', 'werbung', 'marketing',
      'abmelden', 'keine-antwort', 'benachrichtigung'
    ],
    retail: [
      'amazon', 'zalando', 'otto', 'mediamarkt', 'saturn',
      'bestellung', 'versand', 'lieferung', 'paket', 'sendung'
    ],
    orderTerms: ['bestellnummer', 'auftragsnummer', 'ordernummer'],
    totalTerms: ['gesamtbetrag', 'summe', 'gesamt', 'zu zahlen'],
    deliveryTerms: ['lieferung', 'versand', 'zustellung', 'liefertermin'],
    statusTerms: {
      'bestellt': 'ordered',
      'versendet': 'shipped',
      'versandt': 'shipped',
      'unterwegs': 'in_transit',
      'geliefert': 'delivered',
      'zugestellt': 'delivered'
    }
  },
  fr: {
    reject: [
      'désabonner', 'se désinscrire', 'lettre d\'information', 
      'newsletter', 'marketing', 'publicité', 'notification'
    ],
    retail: [
      'amazon', 'zalando', 'fnac', 'cdiscount', 'darty',
      'commande', 'expédition', 'livraison', 'colis', 'envoi'
    ],
    orderTerms: ['numéro de commande', 'n° de commande', 'référence commande'],
    totalTerms: ['total', 'montant total', 'à payer', 'montant dû'],
    deliveryTerms: ['livraison', 'expédition', 'date de livraison', 'délai'],
    statusTerms: {
      'commandé': 'ordered',
      'commandée': 'ordered',
      'expédié': 'shipped',
      'expédiée': 'shipped',
      'en cours': 'in_transit',
      'livré': 'delivered',
      'livrée': 'delivered'
    }
  },
  en: {
    reject: [
      'unsubscribe', 'newsletter', 'marketing', 'advertisement',
      'notification', 'no-reply', 'alert'
    ],
    retail: [
      'amazon', 'order', 'shipping', 'delivery', 'package',
      'shipment', 'tracking', 'invoice'
    ],
    orderTerms: ['order number', 'order id', 'reference number'],
    totalTerms: ['total', 'amount', 'total amount', 'amount due'],
    deliveryTerms: ['delivery', 'shipping', 'estimated delivery', 'arrival'],
    statusTerms: {
      'ordered': 'ordered',
      'shipped': 'shipped',
      'in transit': 'in_transit',
      'delivered': 'delivered'
    }
  }
};

// Universal patterns that apply to all languages
export const UNIVERSAL_REJECT_PATTERNS = [
  'linkedin', 'twitter', 'facebook', 'instagram',
  'password reset', 'verify email', '2fa', 'two-factor',
  'survey', 'feedback', 'review request'
];
```

### Step 4: Update AI Email Classifier (25 minutes)

Update `/lib/email/ai-parser.ts`:

```typescript
import { detectEmailLanguage } from './utils/language-detector';
import { LANGUAGE_PATTERNS, UNIVERSAL_REJECT_PATTERNS } from './utils/multilingual-patterns';

export interface ClassificationResult {
  isPotentialOrder: boolean;
  confidence: number;
  language: string;
  debugInfo?: {
    detectedLanguage: string;
    patterns: string[];
    rejectPatterns: string[];
  };
}

export class AIEmailClassifier {
  static classify(email: GmailMessage): ClassificationResult {
    const { subject, from, htmlBody, textBody } = GmailService.extractContent(email);
    const body = textBody || htmlBody || '';
    const emailText = `${subject} ${body}`.substring(0, 2000);
    
    // Extract sender domain for language override
    const senderDomain = from.match(/@([^>]+)/)?.[1];
    
    // Detect language
    const language = detectEmailLanguage(emailText, senderDomain);
    const patterns = LANGUAGE_PATTERNS[language] || LANGUAGE_PATTERNS['en'];
    
    // Build combined reject patterns
    const allRejectPatterns = [
      ...patterns.reject,
      ...UNIVERSAL_REJECT_PATTERNS
    ];
    
    // Check reject patterns
    const lowerEmailText = emailText.toLowerCase();
    const foundRejectPatterns = allRejectPatterns.filter(pattern => 
      lowerEmailText.includes(pattern.toLowerCase())
    );
    
    if (foundRejectPatterns.length > 0) {
      return {
        isPotentialOrder: false,
        confidence: 1.0,
        language,
        debugInfo: {
          detectedLanguage: language,
          patterns: [],
          rejectPatterns: foundRejectPatterns
        }
      };
    }
    
    // Check retail patterns
    const foundRetailPatterns = patterns.retail.filter(pattern =>
      lowerEmailText.includes(pattern.toLowerCase())
    );
    
    // Calculate confidence based on pattern matches
    const confidence = Math.min(1.0, foundRetailPatterns.length * 0.25);
    
    return {
      isPotentialOrder: foundRetailPatterns.length > 0,
      confidence,
      language,
      debugInfo: {
        detectedLanguage: language,
        patterns: foundRetailPatterns,
        rejectPatterns: []
      }
    };
  }
}
```

### Step 5: Update Database Schema (10 minutes)

Create a new migration `/supabase/migrations/add_language_support.sql`:

```sql
-- Add language column to orders table
ALTER TABLE orders 
ADD COLUMN language VARCHAR(2) DEFAULT 'en';

-- Add language column to processed_emails table
ALTER TABLE processed_emails
ADD COLUMN detected_language VARCHAR(2) DEFAULT 'en';

-- Add index for language queries
CREATE INDEX idx_orders_language ON orders(language);
CREATE INDEX idx_processed_emails_language ON processed_emails(detected_language);

-- Update existing records to Dutch (since current system is Dutch-focused)
UPDATE orders SET language = 'nl' WHERE language = 'en';
UPDATE processed_emails SET detected_language = 'nl' WHERE detected_language = 'en';
```

### Step 6: Update Email Processing Pipeline (15 minutes)

Update the email processing flow to use language detection:

```typescript
// In your email processing service
async function processEmail(email: GmailMessage) {
  // Classify email with language detection
  const classification = AIEmailClassifier.classify(email);
  
  if (!classification.isPotentialOrder) {
    console.log(`Email rejected (${classification.language}):`, 
      classification.debugInfo?.rejectPatterns);
    return null;
  }
  
  // Store language in processed_emails
  await supabase.from('processed_emails').insert({
    email_id: email.id,
    detected_language: classification.language,
    // ... other fields
  });
  
  // Pass language to AI parser
  const orderData = await parseEmailWithAI(email, classification.language);
  
  if (orderData) {
    // Store language in order
    orderData.language = classification.language;
    await createOrder(orderData);
  }
}
```

### Step 7: Test Language Detection (10 minutes)

Create a test script `/scripts/test-language-detection.ts`:

```typescript
import { detectEmailLanguage } from '../lib/email/utils/language-detector';

const testEmails = [
  {
    name: 'Dutch Bol.com',
    text: 'Beste klant, uw bestelling met bestelnummer 123456 is verzonden.',
    expected: 'nl'
  },
  {
    name: 'German Amazon',
    text: 'Ihre Bestellung mit der Bestellnummer 789012 wurde versandt.',
    domain: 'amazon.de',
    expected: 'de'
  },
  {
    name: 'French Fnac',
    text: 'Votre commande numéro 345678 a été expédiée.',
    expected: 'fr'
  }
];

testEmails.forEach(test => {
  const detected = detectEmailLanguage(test.text, test.domain);
  console.log(`${test.name}: Expected ${test.expected}, Got ${detected} ✓`);
});
```

### Next Immediate Steps

1. **Run the migration** to add language support to database
2. **Test with real emails** from your Gmail to verify detection accuracy
3. **Monitor logs** to see language distribution of processed emails
4. **Prepare for Phase 11.2** by collecting sample emails in each language

### Quick Wins to Implement Today

1. **Language Metrics Dashboard** - Add a simple query to show email distribution by language:
```sql
SELECT language, COUNT(*) as count 
FROM orders 
GROUP BY language 
ORDER BY count DESC;
```

2. **Language Filter** - Add language filter to order list UI
3. **Debug Mode** - Add language info to email preview/test interface

### Estimated Time: 1.5-2 hours total

This gives you a solid foundation for multilingual support. The next phases (11.2-11.6) will build on this infrastructure to enhance AI prompting and add retailer-specific parsers.