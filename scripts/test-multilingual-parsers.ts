/**
 * Test script for multilingual parser infrastructure
 * Tests Dutch, German, and French email parsing
 */

import { 
  CoolblueMultilingualParser, 
  AmazonMultilingualParser, 
  ZalandoMultilingualParser,
  parseByRetailer 
} from '../lib/email/parsers/retailer-parsers'
import { HybridEmailParser } from '../lib/email/parsers/hybrid-parser'
import { parseEuropeanNumber, parseEuropeanDate } from '../lib/ai/number-parser'
import { detectEmailLanguage } from '../lib/email/utils/language-detector'
import type { GmailMessage } from '../lib/types/email'

// Mock email data for testing
const mockEmails: Record<string, { email: GmailMessage; language: string; retailer: string }> = {
  coolblue_nl: {
    email: {
      id: 'test1',
      threadId: 'thread1',
      labelIds: [],
      snippet: 'Je bestelling is verzonden',
      payload: {
        headers: [
          { name: 'From', value: 'no-reply@coolblue.nl' },
          { name: 'Subject', value: 'Je bestelling 12345678 is verzonden' },
          { name: 'Date', value: new Date().toISOString() }
        ],
        parts: [{
          mimeType: 'text/plain',
          body: {
            data: Buffer.from(`
              Hallo,
              
              Je bestelling is verzonden en komt naar je toe!
              
              Bestelnummer: 12345678
              Totaalbedrag: €89,99
              Bezorging: 15 januari 2025
              
              Track je pakket: ABC123DEF
              
              Groeten,
              Coolblue
            `).toString('base64')
          }
        }]
      },
      internalDate: Date.now().toString(),
      historyId: 'hist1',
      sizeEstimate: 1000
    },
    language: 'nl',
    retailer: 'coolblue'
  },
  
  amazon_de: {
    email: {
      id: 'test2',
      threadId: 'thread2',
      labelIds: [],
      snippet: 'Ihre Bestellung wurde versandt',
      payload: {
        headers: [
          { name: 'From', value: 'auto-confirm@amazon.de' },
          { name: 'Subject', value: 'Ihre Bestellung wurde versandt' },
          { name: 'Date', value: new Date().toISOString() }
        ],
        parts: [{
          mimeType: 'text/html',
          body: {
            data: Buffer.from(`
              <html>
                <body>
                  <h1>Ihre Bestellung wurde versandt</h1>
                  <p>Bestellnummer: 123-4567890-1234567</p>
                  <p>Gesamtbetrag: €156,78</p>
                  <p>Lieferung: 18. Januar 2025</p>
                  <p>Tracking: 1Z999AA1234567890</p>
                </body>
              </html>
            `).toString('base64')
          }
        }]
      },
      internalDate: Date.now().toString(),
      historyId: 'hist2',
      sizeEstimate: 1500
    },
    language: 'de',
    retailer: 'amazon'
  },
  
  zalando_fr: {
    email: {
      id: 'test3',
      threadId: 'thread3',
      labelIds: [],
      snippet: 'Votre commande a été expédiée',
      payload: {
        headers: [
          { name: 'From', value: 'noreply@zalando.fr' },
          { name: 'Subject', value: 'Votre commande a été expédiée' },
          { name: 'Date', value: new Date().toISOString() }
        ],
        parts: [{
          mimeType: 'text/plain',
          body: {
            data: Buffer.from(`
              Bonjour,
              
              Votre commande a été expédiée !
              
              Numéro de commande: 12345678-1234
              Total: 245,67€
              Livraison: 20 janvier 2025
              
              Suivi: FR123456789
              
              Cordialement,
              Zalando
            `).toString('base64')
          }
        }]
      },
      internalDate: Date.now().toString(),
      historyId: 'hist3',
      sizeEstimate: 1200
    },
    language: 'fr',
    retailer: 'zalando'
  }
}

/**
 * Test European number parsing
 */
function testNumberParsing() {
  console.log('\\n=== Testing European Number Parsing ===')
  
  const testCases = [
    { value: '89,99', language: 'nl', expected: 89.99 },
    { value: '€1.234,56', language: 'de', expected: 1234.56 },
    { value: '1 234,56€', language: 'fr', expected: 1234.56 },
    { value: '€1,234.56', language: 'en', expected: 1234.56 },
    { value: '156,78', language: 'de', expected: 156.78 },
    { value: '245,67€', language: 'fr', expected: 245.67 }
  ]
  
  testCases.forEach(test => {
    const result = parseEuropeanNumber(test.value, test.language)
    const success = Math.abs(result - test.expected) < 0.01
    console.log(`${test.value} (${test.language}) → ${result} ${success ? '✅' : '❌'} (expected ${test.expected})`)
  })
}

/**
 * Test European date parsing
 */
function testDateParsing() {
  console.log('\\n=== Testing European Date Parsing ===')
  
  const testCases = [
    { value: '15/01/2025', language: 'nl', expected: '2025-01-15' },
    { value: '18.01.2025', language: 'de', expected: '2025-01-18' },
    { value: '20/01/2025', language: 'fr', expected: '2025-01-20' },
    { value: '2025-01-22', language: 'en', expected: '2025-01-22' }
  ]
  
  testCases.forEach(test => {
    const result = parseEuropeanDate(test.value, test.language)
    const success = result === test.expected
    console.log(`${test.value} (${test.language}) → ${result} ${success ? '✅' : '❌'} (expected ${test.expected})`)
  })
}

/**
 * Test individual retailer parsers
 */
async function testRetailerParsers() {
  console.log('\\n=== Testing Retailer Parsers ===')
  
  // Test Coolblue Dutch parser
  const coolblueParser = new CoolblueMultilingualParser()
  const coolblueTest = mockEmails.coolblue_nl
  
  if (coolblueParser.canParse(coolblueTest.email, coolblueTest.language)) {
    console.log('✅ Coolblue can parse Dutch email')
    try {
      const result = await coolblueParser.parseByRetailer(
        extractEmailText(coolblueTest.email),
        coolblueTest.retailer,
        coolblueTest.language
      )
      console.log('Coolblue result:', {
        order_number: result.order?.order_number,
        amount: result.order?.amount,
        confidence: result.confidence,
        method: result.method,
        fieldsExtracted: result.debugInfo?.fieldsExtracted
      })
    } catch (error) {
      console.error('❌ Coolblue parsing error:', error)
    }
  } else {
    console.log('❌ Coolblue cannot parse Dutch email')
  }
  
  // Test Amazon German parser
  const amazonParser = new AmazonMultilingualParser()
  const amazonTest = mockEmails.amazon_de
  
  if (amazonParser.canParse(amazonTest.email, amazonTest.language)) {
    console.log('✅ Amazon can parse German email')
    try {
      const result = await amazonParser.parseByRetailer(
        extractEmailText(amazonTest.email),
        amazonTest.retailer,
        amazonTest.language
      )
      console.log('Amazon result:', {
        order_number: result.order?.order_number,
        amount: result.order?.amount,
        confidence: result.confidence,
        method: result.method,
        fieldsExtracted: result.debugInfo?.fieldsExtracted
      })
    } catch (error) {
      console.error('❌ Amazon parsing error:', error)
    }
  } else {
    console.log('❌ Amazon cannot parse German email')
  }
  
  // Test Zalando French parser
  const zalandoParser = new ZalandoMultilingualParser()
  const zalandoTest = mockEmails.zalando_fr
  
  if (zalandoParser.canParse(zalandoTest.email, zalandoTest.language)) {
    console.log('✅ Zalando can parse French email')
    try {
      const result = await zalandoParser.parseByRetailer(
        extractEmailText(zalandoTest.email),
        zalandoTest.retailer,
        zalandoTest.language
      )
      console.log('Zalando result:', {
        order_number: result.order?.order_number,
        amount: result.order?.amount,
        confidence: result.confidence,
        method: result.method,
        fieldsExtracted: result.debugInfo?.fieldsExtracted
      })
    } catch (error) {
      console.error('❌ Zalando parsing error:', error)
    }
  } else {
    console.log('❌ Zalando cannot parse French email')
  }
}

/**
 * Test hybrid parser with all emails
 */
async function testHybridParser() {
  console.log('\\n=== Testing Hybrid Parser ===')
  
  const hybridParser = new HybridEmailParser()
  
  for (const [key, testData] of Object.entries(mockEmails)) {
    console.log(`\\nTesting ${key}:`)
    try {
      const result = await hybridParser.parseEmail(testData.email)
      console.log(`Result:`, {
        order_number: result.order?.order_number,
        amount: result.order?.amount,
        confidence: result.confidence,
        method: result.method,
        processingTime: result.processingTime,
        language: result.debugInfo.language,
        retailer: result.debugInfo.retailer,
        routingDecision: result.debugInfo.routingDecision
      })
    } catch (error) {
      console.error(`❌ Hybrid parsing error for ${key}:`, error)
    }
  }
}

/**
 * Helper function to extract email text
 */
function extractEmailText(email: GmailMessage): string {
  const headers = email.payload.headers || []
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
  
  let bodyText = ''
  const parts = email.payload.parts || [email.payload]
  
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += Buffer.from(part.body.data, 'base64').toString('utf-8')
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      const htmlContent = Buffer.from(part.body.data, 'base64').toString('utf-8')
      bodyText += htmlContent.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ')
    }
  }
  
  return `${subject}\\n\\n${bodyText}`.trim()
}

/**
 * Test language detection
 */
async function testLanguageDetection() {
  console.log('\\n=== Testing Language Detection ===')
  
  for (const [key, testData] of Object.entries(mockEmails)) {
    const emailText = extractEmailText(testData.email)
    try {
      const detectedLanguage = detectEmailLanguage(emailText)
      const success = detectedLanguage === testData.language
      console.log(`${key}: detected ${detectedLanguage} ${success ? '✅' : '❌'} (expected ${testData.language})`)
    } catch (error) {
      console.error(`❌ Language detection error for ${key}:`, error)
    }
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Multilingual Parser Tests\\n')
  
  try {
    testNumberParsing()
    testDateParsing()
    await testLanguageDetection()
    await testRetailerParsers()
    await testHybridParser()
    
    console.log('\\n✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test suite error:', error)
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  runAllTests()
}

export { runAllTests, testNumberParsing, testDateParsing, testLanguageDetection, testRetailerParsers, testHybridParser }