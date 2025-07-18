// MVP: Simple language detection for English and Dutch only

export type SupportedLanguage = 'nld' | 'eng';
export type LanguageCode = 'nl' | 'en';

const LANGUAGE_MAP: Record<SupportedLanguage, LanguageCode> = {
  'nld': 'nl',
  'eng': 'en'
};

// Domain to language mapping for common retailers
const DOMAIN_LANGUAGE_MAP: Record<string, LanguageCode> = {
  // Dutch domains
  'amazon.nl': 'nl',
  'bol.com': 'nl',
  'coolblue.nl': 'nl',
  'coolblue.be': 'nl', // Dutch part of Belgium
  'zalando.nl': 'nl',
  'wehkamp.nl': 'nl',
  'mediamarkt.nl': 'nl',
  'albert.nl': 'nl',
  'ah.nl': 'nl',
  'jumbo.com': 'nl',
  'ikea.nl': 'nl',
  'decathlon.nl': 'nl',
  'hema.nl': 'nl',
  'blokker.nl': 'nl',
  'praxis.nl': 'nl',
  'gamma.nl': 'nl',
  'karwei.nl': 'nl',
  // English/International domains
  'amazon.com': 'en',
  'amazon.co.uk': 'en',
  'ebay.com': 'en',
  'ebay.co.uk': 'en',
  'zalando.com': 'en',
  'asos.com': 'en'
};

// Dutch-specific keywords for detection
const DUTCH_KEYWORDS = [
  'bestelling', 'bestelnummer', 'verzending', 'bezorging', 'levering',
  'bedankt', 'dank je', 'pakket', 'ontvangen', 'afgeleverd',
  'onderweg', 'verzonden', 'totaal', 'bedrag', 'betaald',
  'factuur', 'klant', 'adres', 'postcode', 'nederland'
];

/**
 * Simple language detection for MVP (English/Dutch only)
 * Uses keyword matching for better accuracy on short texts
 */
export function detectEmailLanguage(
  emailText: string, 
  senderDomain?: string
): LanguageCode {
  // Check domain override first
  if (senderDomain) {
    const domain = senderDomain.toLowerCase();
    // Check exact match
    if (DOMAIN_LANGUAGE_MAP[domain]) {
      return DOMAIN_LANGUAGE_MAP[domain];
    }
    // Check if domain ends with .nl
    if (domain.endsWith('.nl')) {
      return 'nl';
    }
  }

  // Simple keyword-based detection
  const lowerText = emailText.toLowerCase();
  const dutchWordCount = DUTCH_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword)
  ).length;

  // If we find 3 or more Dutch keywords, it's likely Dutch
  if (dutchWordCount >= 3) {
    return 'nl';
  }

  // Default to English
  return 'en';
}

/**
 * Get language name for display
 */
export function getLanguageName(code: LanguageCode): string {
  const names: Record<LanguageCode, string> = {
    'nl': 'Dutch',
    'en': 'English'
  };
  return names[code] || 'English';
}

/**
 * Check if an email is in Dutch based on sender and content
 * Used for n8n workflow to determine which prompt to use
 */
export function isDutchEmail(emailText: string, senderEmail?: string): boolean {
  const senderDomain = senderEmail?.split('@')[1];
  return detectEmailLanguage(emailText, senderDomain) === 'nl';
}