export interface LanguagePatterns {
  reject: string[];
  retail: string[];
  orderTerms: string[];
  totalTerms: string[];
  deliveryTerms: string[];
  statusTerms: Record<string, string>;
}

// MVP: Only English and Dutch patterns
export const LANGUAGE_PATTERNS: Record<string, LanguagePatterns> = {
  nl: {
    reject: [
      'afmelden', 'nieuwsbrief', 'marketing', 'advertentie',
      'uitschrijven', 'no-reply', 'kennisgeving',
      // Dutch promotional keywords
      'korting', 'aanbieding', 'uitverkoop', 'sale', 'actie',
      'bespaar', 'voordeel', 'deals', 'opruiming', 'solden'
    ],
    retail: [
      'bol.com', 'coolblue', 'zalando', 'amazon', 'wehkamp',
      'bestelling', 'verzending', 'order', 'levering', 'pakket'
    ],
    orderTerms: ['bestelnummer', 'ordernummer', 'order number'],
    totalTerms: ['totaal', 'totaalbedrag', 'te betalen', 'bedrag'],
    deliveryTerms: ['bezorging', 'levering', 'verzending', 'verwachte leverdatum'],
    statusTerms: {
      'besteld': 'ordered',
      'bevestigd': 'confirmed',
      'verzonden': 'shipped',
      'onderweg': 'in_transit',
      'geleverd': 'delivered',
      'afgeleverd': 'delivered'
    }
  },
  en: {
    reject: [
      'unsubscribe', 'newsletter', 'marketing', 'advertisement',
      'notification', 'no-reply', 'alert',
      // English promotional keywords
      'discount', 'sale', 'offer', 'deal', 'save',
      'bargain', 'promotion', 'special', 'limited time'
    ],
    retail: [
      'amazon', 'order', 'shipping', 'delivery', 'package',
      'shipment', 'tracking', 'invoice', 'purchase', 'receipt'
    ],
    orderTerms: ['order number', 'order id', 'reference number', 'order #'],
    totalTerms: ['total', 'amount', 'total amount', 'amount due', 'grand total'],
    deliveryTerms: ['delivery', 'shipping', 'estimated delivery', 'arrival', 'expected'],
    statusTerms: {
      'ordered': 'ordered',
      'confirmed': 'confirmed',
      'shipped': 'shipped',
      'in transit': 'in_transit',
      'on the way': 'in_transit',
      'delivered': 'delivered'
    }
  }
};

// Universal patterns that apply to all languages
export const UNIVERSAL_REJECT_PATTERNS = [
  'linkedin', 'twitter', 'facebook', 'instagram',
  'password reset', 'verify email', '2fa', 'two-factor',
  'survey', 'feedback', 'review request',
  // Promotional keywords
  'savings', 'sale', 'discount', 'offer', 'deal', 'promo', 'promotion',
  'coupon', 'limited time', 'exclusive', 'special offer', 'ends soon',
  'act now', 'don\'t miss', 'hurry', 'last chance', 'flash sale',
  'clearance', 'bargain', '% off', 'percent off', 'save now',
  'best price', 'lowest price', 'hot deals', 'mega sale', 'super sale',
  'black friday', 'cyber monday', 'summer sale', 'winter sale',
  'spring sale', 'holiday sale', 'weekend sale'
];

// MVP helper: Get patterns for a language (default to English)
export function getPatterns(language: string): LanguagePatterns {
  return LANGUAGE_PATTERNS[language] || LANGUAGE_PATTERNS['en'];
}

// MVP helper: Check if text contains retail indicators
export function containsRetailIndicators(text: string, language: string = 'en'): boolean {
  const patterns = getPatterns(language);
  const lowerText = text.toLowerCase();
  
  return patterns.retail.some(term => lowerText.includes(term));
}

// MVP helper: Check if text contains reject patterns
export function containsRejectPatterns(text: string, language: string = 'en'): boolean {
  const patterns = getPatterns(language);
  const lowerText = text.toLowerCase();
  
  // Check language-specific reject patterns
  const hasLanguageReject = patterns.reject.some(term => lowerText.includes(term));
  
  // Check universal reject patterns
  const hasUniversalReject = UNIVERSAL_REJECT_PATTERNS.some(term => lowerText.includes(term));
  
  return hasLanguageReject || hasUniversalReject;
}