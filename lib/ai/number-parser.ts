/**
 * Parse European number formats based on language
 * MVP: Simplified for English and Dutch only
 */

import { parseFlexibleNumber, parseDutchNumber } from '@/lib/utils/dutch-number-parser'

export function parseEuropeanNumber(value: string | number, language: string): number {
  if (typeof value === 'number') {
    return value
  }

  // MVP: Only handle English and Dutch
  if (language === 'nl') {
    return parseDutchNumber(value)
  } else {
    // Default to flexible parser that auto-detects format
    return parseFlexibleNumber(value)
  }
}

/**
 * Parse European date formats based on language
 * MVP: Simplified for English and Dutch only
 */
export function parseEuropeanDate(value: string, language: string): string | null {
  if (typeof value !== 'string') {
    return null
  }

  // MVP: Only Dutch and English patterns
  const patterns: Record<string, RegExp[]> = {
    nl: [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,  // dd/mm/yyyy or dd-mm-yyyy
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/   // yyyy/mm/dd or yyyy-mm-dd
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
 * MVP: Testing English and Dutch formats only
 */
export function testNumberParser() {
  const tests = [
    // Dutch formats
    { value: '89,99', language: 'nl', expected: 89.99 },
    { value: '1.234,56', language: 'nl', expected: 1234.56 },
    { value: '€89,99', language: 'nl', expected: 89.99 },
    { value: 'EUR 1.234,56', language: 'nl', expected: 1234.56 },
    { value: '123', language: 'nl', expected: 123 },
    
    // English formats
    { value: '89.99', language: 'en', expected: 89.99 },
    { value: '1,234.56', language: 'en', expected: 1234.56 },
    { value: '$89.99', language: 'en', expected: 89.99 },
    { value: 'USD 1,234.56', language: 'en', expected: 1234.56 },
    { value: '123', language: 'en', expected: 123 }
  ]

  console.log('Testing MVP number parser (English/Dutch):')
  tests.forEach(test => {
    const result = parseEuropeanNumber(test.value, test.language)
    const success = result === test.expected
    console.log(`${test.value} (${test.language}) → ${result} ${success ? '✅' : '❌'} (expected ${test.expected})`)
  })
}