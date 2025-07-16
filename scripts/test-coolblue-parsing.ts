import * as dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load from .env.local
dotenv.config({ path: '.env.local' })

// Test email content based on typical Coolblue order confirmation
const testEmail = {
  subject: "✅ Je bestelling is gelukt, Arno!",
  from: "Coolblue <no-reply@coolblue.nl>",
  date: new Date("2025-07-12T18:35:38+00:00"),
  body: `
    Beste Arno,

    Je bestelling is gelukt! We gaan direct voor je aan de slag.

    Bestelnummer: 12345678
    
    Je bestelling:
    - Logitech MX Master 3S Draadloze Muis - Zwart
      Aantal: 1
      Prijs: € 89,99
    
    Subtotaal: € 89,99
    Verzendkosten: Gratis
    Totaal: € 89,99
    
    Bezorging:
    We verwachten je bestelling maandag 15 juli te bezorgen.
    
    Track je pakket:
    Zodra je bestelling onderweg is, krijg je een e-mail met een track & trace code.
    
    Bedankt voor je bestelling!
    
    Vriendelijke groet,
    Team Coolblue
  `
}

async function testCoolblueParsing() {
  console.log('Testing Coolblue email parsing with Gemini...\n')
  
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) {
    console.error('GOOGLE_AI_API_KEY not found in environment')
    return
  }
  
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  
  const prompt = `Analyze this email and determine if it's an order confirmation. If yes, extract order details.

Email:
Subject: ${testEmail.subject}
From: ${testEmail.from}
Date: ${testEmail.date.toISOString()}
Body: ${testEmail.body}

Return a JSON object with this structure:
{
  "isOrder": boolean,
  "orderData": {
    "orderNumber": string,
    "retailer": string,
    "amount": number,
    "currency": string,
    "orderDate": string (ISO format),
    "status": "confirmed" | "shipped" | "delivered",
    "estimatedDelivery": string (ISO format) or null,
    "trackingNumber": string or null,
    "carrier": string or null,
    "items": [
      {
        "name": string,
        "quantity": number,
        "price": number
      }
    ],
    "confidence": number (0-1)
  },
  "debugInfo": {
    "language": string,
    "emailType": string
  }
}

IMPORTANT: 
- Extract amounts as numbers (not strings)
- For Dutch emails, currency is usually "EUR"
- Parse Dutch dates correctly
- Return ONLY valid JSON, no markdown`
  
  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    
    // Clean up the response - Gemini sometimes returns markdown
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    console.log('Raw response:', jsonText)
    
    const parsed = JSON.parse(jsonText)
    
    console.log('\nParsed result:', JSON.stringify(parsed, null, 2))
    
    if (parsed.isOrder && parsed.orderData) {
      console.log('\n✅ Order detected!')
      console.log(`Retailer: ${parsed.orderData.retailer}`)
      console.log(`Order number: ${parsed.orderData.orderNumber}`)
      console.log(`Amount: ${parsed.orderData.currency} ${parsed.orderData.amount}`)
      console.log(`Amount type: ${typeof parsed.orderData.amount}`)
    } else {
      console.log('\n❌ Not detected as order')
      console.log('Debug info:', parsed.debugInfo)
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

testCoolblueParsing()