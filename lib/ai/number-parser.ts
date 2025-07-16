/**
 * Parse European number formats based on language
 * Handles different decimal separators and thousand separators
 */

export function parseEuropeanNumber(value: string, language: string): number {
  if (typeof value !== 'string') {
    return typeof value === 'number' ? value : 0
  }

  // Remove currency symbols and extra spaces
  let cleanValue = value
    .replace(/[€$£¥₹]/g, '') // Remove currency symbols
    .replace(/\s+/g, '') // Remove spaces
    .trim()

  // Handle different number formats by language
  switch (language) {
    case 'nl':
    case 'de':
      // Dutch/German format: 1.234,56 or 1234,56
      if (cleanValue.includes(',') && cleanValue.includes('.')) {
        // Format: 1.234,56 (dot as thousand separator, comma as decimal)
        cleanValue = cleanValue.replace(/\./g, '').replace(',', '.')
      } else if (cleanValue.includes(',')) {
        // Format: 1234,56 (comma as decimal separator)
        cleanValue = cleanValue.replace(',', '.')
      }
      break
    
    case 'fr':
      // French format: 1 234,56 or 1234,56
      if (cleanValue.includes(' ') && cleanValue.includes(',')) {
        // Format: 1 234,56 (space as thousand separator, comma as decimal)
        cleanValue = cleanValue.replace(/\s/g, '').replace(',', '.')
      } else if (cleanValue.includes(',')) {
        // Format: 1234,56 (comma as decimal separator)
        cleanValue = cleanValue.replace(',', '.')
      }
      break
    
    case 'en':
    default:
      // English format: 1,234.56 or 1234.56
      if (cleanValue.includes(',') && cleanValue.includes('.')) {
        // Format: 1,234.56 (comma as thousand separator, dot as decimal)
        cleanValue = cleanValue.replace(/,/g, '')
      }
      // Format: 1234.56 (dot as decimal separator) - no change needed
      break
  }

  // Parse the cleaned value
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Parse European date formats based on language
 * Handles different date separators and formats
 */
export function parseEuropeanDate(value: string, language: string): string | null {
  if (typeof value !== 'string') {
    return null
  }

  // Common patterns
  const patterns: Record<string, RegExp[]> = {
    nl: [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // dd/mm/yyyy or dd-mm-yyyy
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/   // yyyy/mm/dd or yyyy-mm-dd
    ],
    de: [
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,          // dd.mm.yyyy
      /(\d{4})\.(\d{1,2})\.(\d{1,2})/           // yyyy.mm.dd
    ],
    fr: [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,          // dd/mm/yyyy
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/           // yyyy/mm/dd
    ],
    en: [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,          // mm/dd/yyyy
      /(\d{4})-(\d{1,2})-(\d{1,2})/             // yyyy-mm-dd
    ]
  }

  const langPatterns = patterns[language] || patterns['en']
  
  for (const pattern of langPatterns) {
    const match = value.match(pattern)
    if (match) {
      const [, part1, part2, part3] = match
      
      // Determine if it's dd/mm/yyyy or yyyy/mm/dd format
      if (part3.length === 4) {
        // dd/mm/yyyy format
        const day = parseInt(part1)
        const month = parseInt(part2)
        const year = parseInt(part3)
        
        if (day <= 31 && month <= 12) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        }
      } else if (part1.length === 4) {
        // yyyy/mm/dd format
        const year = parseInt(part1)
        const month = parseInt(part2)
        const day = parseInt(part3)
        
        if (day <= 31 && month <= 12) {
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
        }
      }
    }
  }

  return null
}

/**
 * Test the number parser with different formats
 */
export function testNumberParser() {
  const tests = [
    { value: '89,99', language: 'nl', expected: 89.99 },
    { value: '1.234,56', language: 'de', expected: 1234.56 },
    { value: '1 234,56', language: 'fr', expected: 1234.56 },
    { value: '1,234.56', language: 'en', expected: 1234.56 },
    { value: '€89,99', language: 'nl', expected: 89.99 },
    { value: '123', language: 'nl', expected: 123 }
  ]

  console.log('Testing number parser:')
  tests.forEach(test => {
    const result = parseEuropeanNumber(test.value, test.language)
    const success = result === test.expected
    console.log(`${test.value} (${test.language}) → ${result} ${success ? '✅' : '❌'} (expected ${test.expected})`)
  })
}