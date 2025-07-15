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
    if (dateRange && dateRange !== 'all') {
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
    // Gmail batch API has a limit of 100 requests per batch
    const batchSize = 100
    const messages: GmailMessage[] = []
    
    for (let i = 0; i < messageIds.length; i += batchSize) {
      const batch = messageIds.slice(i, i + batchSize)
      const batchPromises = batch.map(id => this.getMessage(id))
      const batchResults = await Promise.all(batchPromises)
      messages.push(...batchResults)
    }
    
    return messages
  }

  /**
   * Search for emails that might contain order confirmations
   */
  async searchOrderEmails(dateRange: DateRange = '6_months'): Promise<{
    messages: Array<{ id: string; threadId: string }>
    nextPageToken?: string
    resultSizeEstimate: number
  }> {
    // Common order confirmation keywords across multiple languages
    const orderKeywords = [
      'order confirmation',
      'order confirmed',
      'purchase confirmation',
      'receipt',
      'invoice',
      'bestelling', // Dutch
      'bevestiging', // Dutch
      'factuur', // Dutch
      'has:attachment', // Often receipts are attached
      'from:noreply', // Many confirmations come from noreply addresses
      'from:orders',
      'from:shop',
      'from:store'
    ]
    
    const query = `(${orderKeywords.join(' OR ')})`
    
    return this.listMessages({
      query,
      dateRange,
      maxResults: 100
    })
  }

  /**
   * Make authenticated request to Gmail API
   */
  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
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
      
      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Gmail API error: ${response.status} - ${error}`)
      }
      
      return response.json()
    } catch (error) {
      console.error('Gmail API request failed:', error)
      throw error
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