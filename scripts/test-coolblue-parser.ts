import { CoolblueParser } from '../lib/email/parsers/retailers/coolblue-parser'
import { CoolblueMultilingualParser } from '../lib/email/parsers/retailer-parsers'
import type { GmailMessage } from '../lib/types/email'

// Test email content similar to what we're parsing
const testEmailContent = `
From: no-reply@coolblue.nl
Subject: Je bestelling (90276634) is gelukt!
Date: 2025-01-09

Beste klant,

Je bestelling (90276634) is gelukt! 

Bestelling details:
- Logitech M705 Marathon draadloze muis
Prijs: € 89,99

Totaal: € 89,99

Bedankt voor je bestelling!
`

// Create a mock GmailMessage
const mockEmail: GmailMessage = {
  id: 'test123',
  threadId: 'thread123',
  labelIds: [],
  payload: {
    headers: [
      { name: 'From', value: 'no-reply@coolblue.nl' },
      { name: 'Subject', value: 'Je bestelling (90276634) is gelukt!' },
      { name: 'Date', value: '2025-01-09' }
    ],
    parts: [{
      mimeType: 'text/plain',
      body: {
        data: Buffer.from(testEmailContent).toString('base64')
      }
    }]
  }
}

async function testParsers() {
  console.log('Testing Coolblue parsers...\n')
  
  // Test the main Coolblue parser
  const parser = new CoolblueParser()
  
  console.log('Can parse:', parser.canParse(mockEmail))
  
  if (parser.canParse(mockEmail)) {
    try {
      const result = await parser.parse(mockEmail)
      console.log('\nCoolblueParser result:')
      console.log(JSON.stringify(result, null, 2))
    } catch (error) {
      console.error('CoolblueParser error:', error)
    }
  }
  
  // Test the multilingual parser directly
  console.log('\n\nTesting CoolblueMultilingualParser directly...')
  const multiParser = new CoolblueMultilingualParser()
  
  try {
    const result = await multiParser.parseByRetailer(testEmailContent, 'coolblue', 'nl')
    console.log('\nCoolblueMultilingualParser result:')
    console.log(JSON.stringify(result, null, 2))
  } catch (error) {
    console.error('CoolblueMultilingualParser error:', error)
  }
}

testParsers().catch(console.error)