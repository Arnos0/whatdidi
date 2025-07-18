/**
 * Test cases for MVP transformation utilities
 * Tests Dutch number parsing, status mapping, and language detection
 */

import { parseDutchNumber, parseFlexibleNumber, isDutchNumberFormat } from '../dutch-number-parser'
import { normalizeOrderStatus, detectOrderStatus } from '../status-mapper'
import { detectEmailLanguage } from '../../email/utils/language-detector'

describe('Dutch Number Parser', () => {
  describe('parseDutchNumber', () => {
    test('should parse Dutch decimal format', () => {
      expect(parseDutchNumber('89,99')).toBe(89.99)
      expect(parseDutchNumber('1,50')).toBe(1.50)
      expect(parseDutchNumber('0,25')).toBe(0.25)
    })

    test('should parse Dutch thousands format', () => {
      expect(parseDutchNumber('1.234,56')).toBe(1234.56)
      expect(parseDutchNumber('12.345,67')).toBe(12345.67)
      expect(parseDutchNumber('123.456,78')).toBe(123456.78)
    })

    test('should handle currency symbols', () => {
      expect(parseDutchNumber('€89,99')).toBe(89.99)
      expect(parseDutchNumber('EUR 1.234,56')).toBe(1234.56)
      expect(parseDutchNumber('€ 2.500,00')).toBe(2500.00)
    })

    test('should handle numbers without formatting', () => {
      expect(parseDutchNumber('123')).toBe(123)
      expect(parseDutchNumber('0')).toBe(0)
      expect(parseDutchNumber('99')).toBe(99)
    })

    test('should return 0 for invalid input', () => {
      expect(parseDutchNumber('invalid')).toBe(0)
      expect(parseDutchNumber('')).toBe(0)
      expect(parseDutchNumber('abc,def')).toBe(0)
    })
  })

  describe('parseFlexibleNumber', () => {
    test('should parse English format', () => {
      expect(parseFlexibleNumber('89.99')).toBe(89.99)
      expect(parseFlexibleNumber('1,234.56')).toBe(1234.56)
      expect(parseFlexibleNumber('$89.99')).toBe(89.99)
    })

    test('should detect and parse Dutch format', () => {
      expect(parseFlexibleNumber('89,99')).toBe(89.99)
      expect(parseFlexibleNumber('1.234,56')).toBe(1234.56)
      expect(parseFlexibleNumber('€89,99')).toBe(89.99)
    })
  })

  describe('isDutchNumberFormat', () => {
    test('should detect Dutch format', () => {
      expect(isDutchNumberFormat('89,99')).toBe(true)
      expect(isDutchNumberFormat('1.234,56')).toBe(true)
      expect(isDutchNumberFormat('€89,99')).toBe(true)
    })

    test('should reject English format', () => {
      expect(isDutchNumberFormat('89.99')).toBe(false)
      expect(isDutchNumberFormat('1,234.56')).toBe(false)
      expect(isDutchNumberFormat('$89.99')).toBe(false)
    })
  })
})

describe('Status Mapper', () => {
  describe('normalizeOrderStatus', () => {
    test('should normalize standard statuses', () => {
      expect(normalizeOrderStatus('pending')).toBe('pending')
      expect(normalizeOrderStatus('shipped')).toBe('shipped')
      expect(normalizeOrderStatus('delivered')).toBe('delivered')
      expect(normalizeOrderStatus('cancelled')).toBe('cancelled')
    })

    test('should map confirmed to pending', () => {
      expect(normalizeOrderStatus('confirmed')).toBe('pending')
      expect(normalizeOrderStatus('order confirmed')).toBe('pending')
      expect(normalizeOrderStatus('bevestigd')).toBe('pending')
    })

    test('should map Dutch statuses', () => {
      expect(normalizeOrderStatus('verzonden')).toBe('shipped')
      expect(normalizeOrderStatus('onderweg')).toBe('shipped')
      expect(normalizeOrderStatus('bezorgd')).toBe('delivered')
      expect(normalizeOrderStatus('afgeleverd')).toBe('delivered')
      expect(normalizeOrderStatus('geannuleerd')).toBe('cancelled')
    })

    test('should handle case insensitive input', () => {
      expect(normalizeOrderStatus('SHIPPED')).toBe('shipped')
      expect(normalizeOrderStatus('Delivered')).toBe('delivered')
      expect(normalizeOrderStatus('VERZONDEN')).toBe('shipped')
    })

    test('should default to pending for unknown statuses', () => {
      expect(normalizeOrderStatus('unknown')).toBe('pending')
      expect(normalizeOrderStatus('')).toBe('pending')
      expect(normalizeOrderStatus('random')).toBe('pending')
    })
  })

  describe('detectOrderStatus', () => {
    test('should detect English order statuses', () => {
      expect(detectOrderStatus('Your order has been confirmed', 'en')).toBe('pending')
      expect(detectOrderStatus('Package has been shipped', 'en')).toBe('shipped')
      expect(detectOrderStatus('Order delivered successfully', 'en')).toBe('delivered')
      expect(detectOrderStatus('Order has been cancelled', 'en')).toBe('cancelled')
    })

    test('should detect Dutch order statuses', () => {
      expect(detectOrderStatus('Je bestelling is bevestigd', 'nl')).toBe('pending')
      expect(detectOrderStatus('Pakket is verzonden', 'nl')).toBe('shipped')
      expect(detectOrderStatus('Bestelling is bezorgd', 'nl')).toBe('delivered')
      expect(detectOrderStatus('Bestelling geannuleerd', 'nl')).toBe('cancelled')
    })

    test('should default to pending for unrecognized text', () => {
      expect(detectOrderStatus('Random text', 'en')).toBe('pending')
      expect(detectOrderStatus('Willekeurige tekst', 'nl')).toBe('pending')
    })
  })
})

describe('Language Detection', () => {
  describe('detectEmailLanguage', () => {
    test('should detect Dutch by keywords', () => {
      const dutchText = 'Bedankt voor je bestelling bij Coolblue. Je pakket is onderweg.'
      expect(detectEmailLanguage(dutchText)).toBe('nl')
    })

    test('should detect Dutch by domain', () => {
      const text = 'Your order is ready'
      expect(detectEmailLanguage(text, 'coolblue.nl')).toBe('nl')
      expect(detectEmailLanguage(text, 'bol.com')).toBe('nl')
      expect(detectEmailLanguage(text, 'albert.nl')).toBe('nl')
    })

    test('should default to English', () => {
      const englishText = 'Thank you for your order. Your package is on the way.'
      expect(detectEmailLanguage(englishText)).toBe('en')
    })

    test('should handle empty text', () => {
      expect(detectEmailLanguage('')).toBe('en')
      expect(detectEmailLanguage(' ')).toBe('en')
    })

    test('should detect English by domain', () => {
      const text = 'Random text'
      expect(detectEmailLanguage(text, 'amazon.com')).toBe('en')
      expect(detectEmailLanguage(text, 'ebay.com')).toBe('en')
      expect(detectEmailLanguage(text, 'zalando.com')).toBe('en')
    })
  })
})

describe('Integration Tests', () => {
  test('should handle complete Dutch order email', () => {
    const emailText = `
      Bedankt voor je bestelling bij Coolblue!
      
      Bestelnummer: 12345678
      Totaalbedrag: €1.234,56
      Status: Verzonden
      
      Je pakket is onderweg en wordt morgen bezorgd.
    `
    
    const language = detectEmailLanguage(emailText)
    const status = detectOrderStatus(emailText, language)
    const amount = parseFlexibleNumber('€1.234,56')
    
    expect(language).toBe('nl')
    expect(status).toBe('shipped')
    expect(amount).toBe(1234.56)
  })

  test('should handle complete English order email', () => {
    const emailText = `
      Thank you for your order from Amazon!
      
      Order Number: 987654321
      Total Amount: $123.45
      Status: Shipped
      
      Your package is on the way and will be delivered tomorrow.
    `
    
    const language = detectEmailLanguage(emailText)
    const status = detectOrderStatus(emailText, language)
    const amount = parseFlexibleNumber('$123.45')
    
    expect(language).toBe('en')
    expect(status).toBe('shipped')
    expect(amount).toBe(123.45)
  })
})