import * as dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load from .env.local
dotenv.config({ path: '.env.local' })

// Real Coolblue order confirmation patterns
const coolblueExamples = [
  {
    name: "Order Confirmation",
    email: {
      subject: "✅ Je bestelling is gelukt, Arno!",
      from: "Coolblue <no-reply@coolblue.nl>",
      date: new Date("2025-07-12T18:35:38+00:00"),
      body: `
Beste Arno,

Goed nieuws! Je bestelling is gelukt.

Bestelnummer: 30298765
Besteldatum: 12 juli 2025

Je bestelling:
Logitech MX Master 3S Draadloze Muis - Grafiet
Aantal: 1 x € 89,99

Subtotaal: € 89,99
Verzendkosten: Gratis
Totaal: € 89,99

Bezorging:
We verwachten je bestelling maandag 15 juli bij je te bezorgen.

Betaling:
Je hebt betaald met iDEAL.

Bedankt voor je bestelling!

Met vriendelijke groet,
Team Coolblue
      `
    }
  },
  {
    name: "Shipping Notification",
    email: {
      subject: "Je bestelling komt naar je toe",
      from: "Coolblue <no-reply@coolblue.nl>",
      date: new Date("2025-07-12T19:18:16+00:00"),
      body: `
Beste Arno,

Je bestelling is onderweg!

Bestelnummer: 30298765

Track & Trace:
Je pakket heeft trackingnummer: 3SCOOL1234567890
Volg je pakket: https://track.coolblue.nl/...

Bezorging:
We bezorgen je pakket morgen tussen 08:00 en 22:00 uur.

Je bestelling:
- Logitech MX Master 3S Draadloze Muis - Grafiet

Tot morgen!

Team Coolblue
      `
    }
  }
]

async function testGeminiWithCoolblue() {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY not found')
    return
  }
  
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: "application/json"
    }
  })
  
  for (const example of coolblueExamples) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${example.name}`)
    console.log(`Subject: ${example.email.subject}`)
    console.log('='.repeat(60))
    
    const emailText = `
From: ${example.email.from}
Subject: ${example.email.subject}
Date: ${example.email.date.toISOString()}

${example.email.body}
`
    
    const prompt = `Analyze this email. If it's an order (purchase confirmation/shipping/delivery), extract:
- orderNumber (look for: bestelnummer, ordernummer, order number, order #)
- retailer (from sender email domain or company name)
- amount & currency (look for: totaal, total, bedrag, EUR, €)
- orderDate (ISO format)
- status (confirmed/shipped/delivered)
- estimatedDelivery (look for: bezorging, levering, delivery)
- trackingNumber & carrier (if present)
- items array with name, quantity, price (if detailed)
- confidence (0-1)

IMPORTANT for Dutch emails:
- "bestelnummer" = order number
- "totaal" or "totaalbedrag" = total amount
- "bezorging" or "levering" = delivery
- Currency is usually EUR (€)

Return ONLY valid JSON:
{"isOrder": true/false, "orderData": {...}, "debugInfo": {"language": "xx", "emailType": "..."}}

Email:
${emailText}`
    
    try {
      const result = await model.generateContent(prompt)
      const response = result.response.text()
      console.log('\nGemini response:')
      console.log(response)
      
      const parsed = JSON.parse(response)
      
      if (parsed.isOrder && parsed.orderData) {
        console.log('\n✅ Order detected!')
        console.log(`Order number: ${parsed.orderData.orderNumber}`)
        console.log(`Amount: ${parsed.orderData.currency} ${parsed.orderData.amount}`)
        console.log(`Status: ${parsed.orderData.status}`)
        
        // Check for missing data
        if (!parsed.orderData.orderNumber) {
          console.log('❌ WARNING: Order number is missing!')
        }
        if (!parsed.orderData.amount || parsed.orderData.amount === 0) {
          console.log('❌ WARNING: Amount is missing or zero!')
        }
      }
      
    } catch (error) {
      console.error('Error:', error)
    }
  }
}

testGeminiWithCoolblue()