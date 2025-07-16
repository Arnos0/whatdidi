import 'server-only'
import { tokenEncryption } from '@/lib/oauth/oauth-service'
import type { GmailMessage, DateRange } from '@/lib/types/email'
import { getDateFromRange } from '@/lib/types/email'

export class GmailService {
  private accessToken: string
  private refreshToken: string | null
  
  constructor(encryptedAccessToken: string, encryptedRefreshToken: string | null) {
    this.accessToken = tokenEncryption.decrypt(encryptedAccessToken)
    this.refreshToken = encryptedRefreshToken ? tokenEncryption.decrypt(encryptedRefreshToken) : null
  }

  /**
   * List messages from Gmail with optional filters
   */
  async listMessages(options: {
    query?: string
    maxResults?: number
    pageToken?: string
    dateRange?: DateRange
  } = {}): Promise<{
    messages: Array<{ id: string; threadId: string }>
    nextPageToken?: string
    resultSizeEstimate: number
  }> {
    const { query = '', maxResults = 50, pageToken, dateRange } = options
    
    // Build query with date filter if specified
    let fullQuery = query
    if (dateRange) {
      const fromDate = getDateFromRange(dateRange)
      if (fromDate) {
        const dateStr = fromDate.toISOString().split('T')[0]
        fullQuery = `${query} after:${dateStr}`.trim()
      }
    }
    
    const params = new URLSearchParams({
      ...(fullQuery && { q: fullQuery }),
      ...(maxResults && { maxResults: maxResults.toString() }),
      ...(pageToken && { pageToken })
    })
    
    const response = await this.makeRequest(
      `https://www.googleapis.com/gmail/v1/users/me/messages?${params}`
    )
    
    return response
  }

  /**
   * Get a single message by ID with full content
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    const response = await this.makeRequest(
      `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}`
    )
    
    return response
  }

  /**
   * Get multiple messages in a batch (more efficient)
   */
  async getMessagesBatch(messageIds: string[]): Promise<GmailMessage[]> {
    // Increase concurrent requests for better performance
    const concurrentLimit = 10 // Process 10 at a time
    const messages: GmailMessage[] = []
    let rateLimitDelay = 100 // Start with minimal delay
    
    // Process in smaller chunks with adaptive delays
    for (let i = 0; i < messageIds.length; i += concurrentLimit) {
      const batch = messageIds.slice(i, i + concurrentLimit)
      const startTime = Date.now()
      
      // Process this batch
      const batchPromises = batch.map(id => this.getMessage(id))
      try {
        const batchResults = await Promise.all(batchPromises)
        messages.push(...batchResults)
        
        // Reset delay on success
        rateLimitDelay = Math.max(100, rateLimitDelay * 0.9)
      } catch (error: any) {
        console.error(`Error processing batch starting at index ${i}:`, error)
        
        // If rate limited, increase delay
        if (error.message?.includes('429') || error.message?.includes('Rate')) {
          rateLimitDelay = Math.min(2000, rateLimitDelay * 2)
          console.log(`Rate limited, increasing delay to ${rateLimitDelay}ms`)
        }
        // Continue with next batch even if this one fails
      }
      
      // Add adaptive delay between batches
      if (i + concurrentLimit < messageIds.length) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay))
      }
      
      // Log progress with timing
      const elapsed = Date.now() - startTime
      console.log(`Fetched ${messages.length}/${messageIds.length} messages (${elapsed}ms)...`)
    }
    
    return messages
  }

  /**
   * Get ALL emails within a date range - no filtering
   * This is used for Full Scan functionality where we check every email
   */
  async searchOrderEmails(dateRange: DateRange = '6_months'): Promise<{
    messages: Array<{ id: string; threadId: string }>
    nextPageToken?: string
    resultSizeEstimate: number
  }> {
    // For full scan: NO search query - get ALL emails
    // We'll let the parsers determine what's an order
    const query = ''
    
    console.log('Full Scan: Getting ALL emails from Gmail')
    console.log('Date range:', dateRange)
    
    // Fetch ALL messages using pagination
    let allMessages: Array<{ id: string; threadId: string }> = []
    let pageToken: string | undefined
    let totalEstimate = 0
    
    do {
      const result = await this.listMessages({
        query,
        dateRange,
        maxResults: 500, // Max allowed per request
        pageToken
      })
      
      if (result.messages) {
        allMessages = allMessages.concat(result.messages)
      }
      
      pageToken = result.nextPageToken
      totalEstimate = result.resultSizeEstimate || 0
      
      console.log(`Fetched ${allMessages.length} messages so far (estimated total: ${totalEstimate})...`)
      
      // Add small delay between pages to avoid rate limits
      if (pageToken) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    } while (pageToken && allMessages.length < 5000) // Safety limit of 5000 emails
    
    console.log('Gmail search complete:', {
      estimated: totalEstimate,
      returned: allMessages.length
    })
    
    return {
      messages: allMessages,
      resultSizeEstimate: totalEstimate
    }
  }

  /**
   * Make authenticated request to Gmail API
   */
  private async makeRequest(url: string, options: RequestInit = {}, retries = 3): Promise<any> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        })
        
        if (response.status === 401) {
          // Token expired, try to refresh
          if (this.refreshToken) {
            await this.refreshAccessToken()
            // Retry the request with new token
            return this.makeRequest(url, options)
          } else {
            throw new Error('Access token expired and no refresh token available')
          }
        }
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get('Retry-After') || '5'
          const waitTime = parseInt(retryAfter) * 1000
          console.log(`Rate limited. Waiting ${waitTime}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue // Retry the request
        }
        
        if (!response.ok) {
          const error = await response.text()
          throw new Error(`Gmail API error: ${response.status} - ${error}`)
        }
        
        return response.json()
      } catch (error) {
        if (attempt === retries - 1) {
          console.error('Gmail API request failed after retries:', error)
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token: this.refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        grant_type: 'refresh_token'
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }
    
    const data = await response.json()
    this.accessToken = data.access_token
    
    // Note: You should update the encrypted token in the database here
    // This is handled by the calling code to maintain separation of concerns
  }

  /**
   * Extract email content from Gmail message
   */
  static extractContent(message: GmailMessage): {
    subject: string
    from: string
    date: Date
    htmlBody: string
    textBody: string
    attachments: Array<{ filename: string; mimeType: string; size: number }>
  } {
    const headers = message.payload.headers || []
    const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || ''
    const from = headers.find(h => h.name.toLowerCase() === 'from')?.value || ''
    const dateHeader = headers.find(h => h.name.toLowerCase() === 'date')?.value || ''
    const date = new Date(parseInt(message.internalDate))
    
    let htmlBody = ''
    let textBody = ''
    const attachments: Array<{ filename: string; mimeType: string; size: number }> = []
    
    // Extract body content
    const extractPart = (part: any) => {
      if (part.mimeType === 'text/html' && part.body?.data) {
        htmlBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
      } else if (part.mimeType === 'text/plain' && part.body?.data) {
        textBody = Buffer.from(part.body.data, 'base64').toString('utf-8')
      } else if (part.filename) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body?.size || 0
        })
      }
      
      // Recursively process multipart messages
      if (part.parts) {
        part.parts.forEach(extractPart)
      }
    }
    
    if (message.payload.parts) {
      message.payload.parts.forEach(extractPart)
    } else if (message.payload.body?.data) {
      // Simple message with body at root level
      if (message.payload.mimeType === 'text/html') {
        htmlBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
      } else {
        textBody = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
      }
    }
    
    return {
      subject,
      from,
      date,
      htmlBody,
      textBody,
      attachments
    }
  }
}