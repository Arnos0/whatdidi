/**
 * Dutch number format parser for MVP
 * Converts Dutch number formats to standard JavaScript numbers
 */

/**
 * Parse Dutch formatted number string to number
 * Examples:
 * - "89,99" → 89.99
 * - "1.234,56" → 1234.56
 * - "1.234.567,89" → 1234567.89
 * - "€ 89,99" → 89.99
 * - "EUR 1.234,56" → 1234.56
 */
export function parseDutchNumber(value: string | number): number {
  // If already a number, return as is
  if (typeof value === 'number') {
    return value
  }

  // Remove currency symbols and spaces
  let cleaned = value
    .replace(/[€$£¥]/g, '')
    .replace(/EUR|USD|GBP/gi, '')
    .trim()

  // Handle Dutch format: dots for thousands, comma for decimal
  if (cleaned.includes(',')) {
    // Check if this is Dutch format (has comma but not as thousand separator)
    const parts = cleaned.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      // This is likely Dutch format (e.g., "1.234,56" or "89,99")
      cleaned = cleaned
        .replace(/\./g, '') // Remove thousand separators
        .replace(',', '.')  // Convert decimal comma to dot
    }
  }

  // Parse to number
  const parsed = parseFloat(cleaned)
  
  // Return 0 for invalid numbers
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Format number to Dutch currency format
 * Examples:
 * - 89.99 → "€89,99"
 * - 1234.56 → "€1.234,56"
 */
export function formatDutchCurrency(value: number, currency: string = 'EUR'): string {
  const symbol = currency === 'EUR' ? '€' : currency
  
  // Format with Dutch locale
  const formatted = new Intl.NumberFormat('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
  
  return `${symbol}${formatted}`
}

/**
 * Detect if a string contains Dutch number format
 */
export function isDutchNumberFormat(value: string): boolean {
  // Check for comma as decimal separator with 2 digits after
  const dutchDecimalPattern = /\d+,\d{1,2}(?!\d)/
  
  // Check for dots as thousand separators
  const dutchThousandPattern = /\d{1,3}(\.\d{3})+,\d{1,2}/
  
  return dutchDecimalPattern.test(value) || dutchThousandPattern.test(value)
}

/**
 * Parse any number format (Dutch or English)
 * Automatically detects format and parses accordingly
 */
export function parseFlexibleNumber(value: string | number): number {
  if (typeof value === 'number') {
    return value
  }

  // Check if it's Dutch format
  if (isDutchNumberFormat(value)) {
    return parseDutchNumber(value)
  }

  // Otherwise parse as standard format
  const cleaned = value
    .replace(/[€$£¥]/g, '')
    .replace(/EUR|USD|GBP/gi, '')
    .replace(/,/g, '') // Remove thousand separators in English format
    .trim()

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}