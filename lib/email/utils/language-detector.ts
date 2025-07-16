import { franc } from 'franc';

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