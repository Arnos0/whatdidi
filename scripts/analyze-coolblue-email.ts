import * as dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Load from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function analyzeCoolblueEmail() {
  console.log('Fetching and analyzing Coolblue order email...\n')
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get the order confirmation email ID
  const gmailMessageId = '197ffebe422c572b' // "✅ Je bestelling is gelukt, Arno!"
  
  // Get email account info
  const { data: emailAccounts } = await supabase
    .from('email_accounts')
    .select('*')
    .limit(1)
    .single()
  
  if (!emailAccounts) {
    console.error('No email account found')
    return
  }
  
  console.log(`Using email account: ${emailAccounts.email}`)
  
  // Decrypt tokens
  const CryptoJS = require('crypto-js')
  const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || 'development-key-not-for-production'
  
  const accessToken = CryptoJS.AES.decrypt(emailAccounts.access_token, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8)
  
  // Initialize Gmail API
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
  
  try {
    // Fetch the email
    console.log(`\nFetching email ${gmailMessageId}...`)
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: gmailMessageId
    })
    
    const message = response.data
    const headers = message.payload?.headers || []
    const subject = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || ''
    const from = headers.find(h => h.name?.toLowerCase() === 'from')?.value || ''
    
    console.log(`Subject: ${subject}`)
    console.log(`From: ${from}`)
    
    // Extract body
    let htmlBody = ''
    let textBody = ''
    
    const extractPart = (part: any) => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        textBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      if (part.parts) {
        part.parts.forEach(extractPart)
      }
    }
    
    if (message.payload?.parts) {
      message.payload.parts.forEach(extractPart)
    } else if (message.payload?.body?.data) {
      if (message.payload.mimeType === 'text/html') {
        htmlBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
      } else {
        textBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
      }
    }
    
    const body = htmlBody || textBody
    console.log(`\nBody length: ${body.length} characters`)
    
    // Save the HTML to a file for inspection
    const fs = require('fs')
    fs.writeFileSync('coolblue-email.html', htmlBody || textBody)
    console.log('Saved email content to coolblue-email.html')
    
    // Clean the body for AI analysis
    let cleanedBody = body
    if (htmlBody) {
      // Remove script and style tags
      cleanedBody = cleanedBody.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      cleanedBody = cleanedBody.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove HTML tags but keep content
      cleanedBody = cleanedBody.replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      cleanedBody = cleanedBody
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
    }
    
    // Limit length
    cleanedBody = cleanedBody.substring(0, 5000)
    
    // Now analyze with Gemini
    console.log('\nAnalyzing with Gemini...')
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const prompt = `Analyze this email and extract order information.

Email:
Subject: ${subject}
From: ${from}
Body: ${cleanedBody}

Extract the following information:
- Order number (bestelnummer)
- Total amount (in EUR)
- Items ordered
- Delivery date

Return as JSON with this structure:
{
  "orderNumber": "...",
  "amount": 0.00,
  "currency": "EUR",
  "items": [{"name": "...", "quantity": 1, "price": 0.00}],
  "estimatedDelivery": "YYYY-MM-DD"
}

IMPORTANT: Look for Dutch terms like "bestelnummer", "totaal", "bezorging"`
    
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    console.log('\nGemini response:')
    console.log(text)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

analyzeCoolblueEmail().catch(console.error)