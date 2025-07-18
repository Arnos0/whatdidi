/**
 * Currency formatting utilities for Dutch and English locales
 */

export interface CurrencyOptions {
  currency?: string
  locale?: 'en-US' | 'en-GB' | 'nl-NL'
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Format amount as currency with proper Dutch formatting
 * Dutch: € 89,99 or € 1.234,56
 * English: €89.99 or €1,234.56
 */
export function formatCurrency(
  amount: number, 
  options: CurrencyOptions = {}
): string {
  const {
    currency = 'EUR',
    locale = 'nl-NL',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits
    })
    
    return formatter.format(amount)
  } catch (error) {
    // Fallback formatting
    console.warn('Currency formatting failed, using fallback:', error)
    return `€${amount.toFixed(2)}`
  }
}

/**
 * Format amount in Dutch style (comma as decimal separator)
 */
export function formatDutchCurrency(amount: number, currency = '€'): string {
  return formatCurrency(amount, { 
    locale: 'nl-NL',
    currency: currency === '€' ? 'EUR' : currency
  })
}

/**
 * Format amount in English style (dot as decimal separator)
 */
export function formatEnglishCurrency(amount: number, currency = 'EUR'): string {
  return formatCurrency(amount, { 
    locale: 'en-US',
    currency
  })
}

/**
 * Parse Dutch formatted amount string to number
 * "€ 89,99" -> 89.99
 * "€ 1.234,56" -> 1234.56
 */
export function parseDutchCurrency(value: string): number {
  if (!value) return 0
  
  // Remove currency symbols and spaces
  const cleaned = value
    .replace(/[€$£¥₹]/g, '') // Remove currency symbols
    .replace(/\s+/g, '') // Remove spaces
    .trim()
  
  if (!cleaned) return 0
  
  // Check if it looks like Dutch format (comma as decimal separator)
  const hasDutchDecimal = /,\d{1,2}$/.test(cleaned)
  
  if (hasDutchDecimal) {
    // Dutch format: 1.234,56
    const parts = cleaned.split(',')
    const integerPart = parts[0].replace(/\./g, '') // Remove thousand separators
    const decimalPart = parts[1] || '00'
    
    return parseFloat(`${integerPart}.${decimalPart}`)
  } else {
    // Assume English format or plain number
    return parseFloat(cleaned.replace(/,/g, '')) || 0
  }
}

/**
 * Format number with Dutch thousand separators and decimal comma
 * 1234.56 -> "1.234,56"
 */
export function formatDutchNumber(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Auto-detect locale and format accordingly
 */
export function formatCurrencyAuto(
  amount: number, 
  language: 'en' | 'nl' = 'en',
  currency = 'EUR'
): string {
  if (language === 'nl') {
    return formatDutchCurrency(amount, currency)
  } else {
    return formatEnglishCurrency(amount, currency)
  }
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'JPY': '¥',
    'INR': '₹'
  }
  
  return symbols[currency.toUpperCase()] || currency
}

/**
 * Format amount as compact currency (for dashboards)
 * 1234.56 -> "€1.2K" (en) or "€ 1,2K" (nl)
 */
export function formatCompactCurrency(
  amount: number,
  language: 'en' | 'nl' = 'en',
  currency = 'EUR'
): string {
  const locale = language === 'nl' ? 'nl-NL' : 'en-US'
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount)
  } catch (error) {
    // Fallback for compact notation
    if (amount >= 1000000) {
      return `${getCurrencySymbol(currency)}${(amount / 1000000).toFixed(1)}M`
    } else if (amount >= 1000) {
      return `${getCurrencySymbol(currency)}${(amount / 1000).toFixed(1)}K`
    } else {
      return formatCurrencyAuto(amount, language, currency)
    }
  }
}