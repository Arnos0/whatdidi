import 'server-only'
import CryptoJS from 'crypto-js'
import type { EmailProvider } from '@/lib/supabase/types'

// Get encryption key from environment with validation
function getEncryptionKey(): string {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required in production')
    }
    console.warn('⚠️  WARNING: Using development encryption key. Set TOKEN_ENCRYPTION_KEY in production.')
    return 'development-key-not-for-production'
  }
  
  // Validate key strength (minimum 32 characters)
  if (key.length < 32) {
    throw new Error('TOKEN_ENCRYPTION_KEY must be at least 32 characters long for security')
  }
  
  return key
}

const ENCRYPTION_KEY = getEncryptionKey()

// Token encryption utilities
export const tokenEncryption = {
  encrypt(token: string): string {
    return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString()
  },
  
  decrypt(encryptedToken: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  }
}

// OAuth token response types
export interface OAuthTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}

// OAuth provider interface
export interface OAuthProvider {
  getAuthorizationUrl(state: string): string
  exchangeCodeForTokens(code: string): Promise<OAuthTokens>
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>
  getUserEmail(accessToken: string): Promise<string>
}

// Base OAuth configuration
interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

// Google OAuth implementation
export class GoogleOAuthProvider implements OAuthProvider {
  private config: OAuthConfig

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID || ''
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3002/api/auth/google/callback'

    if (!clientId || !clientSecret) {
      console.warn('Google OAuth credentials not configured')
    }

    this.config = {
      clientId,
      clientSecret,
      redirectUri,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'email']
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for tokens')
    }

    return response.json()
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }

    return response.json()
  }

  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user email')
    }

    const data = await response.json()
    return data.email
  }
}

// Microsoft OAuth implementation
export class MicrosoftOAuthProvider implements OAuthProvider {
  private config: OAuthConfig
  private tenant = 'common' // Supports both personal and work accounts

  constructor() {
    const clientId = process.env.MICROSOFT_CLIENT_ID || ''
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || ''
    const redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3002/api/auth/microsoft/callback'

    if (!clientId || !clientSecret) {
      console.warn('Microsoft OAuth credentials not configured')
    }

    this.config = {
      clientId,
      clientSecret,
      redirectUri,
      scopes: ['openid', 'email', 'profile', 'offline_access', 'User.Read', 'Mail.Read']
    }
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes.join(' '),
      response_mode: 'query',
      state
    })

    return `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/authorize?${params}`
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(`https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code for tokens')
    }

    return response.json()
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(`https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        scope: this.config.scopes.join(' ')
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh access token')
    }

    return response.json()
  }

  async getUserEmail(accessToken: string): Promise<string> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Microsoft Graph API error:', response.status, errorText)
      throw new Error('Failed to fetch user email')
    }

    const data = await response.json()
    console.log('Microsoft user data:', data)
    
    // Try different fields where email might be stored
    const email = data.mail || data.userPrincipalName || data.preferredName || data.email
    if (!email) {
      console.error('No email found in Microsoft response:', data)
      throw new Error('No email address found in Microsoft account')
    }
    return email
  }
}

// Factory function to get OAuth provider
export function getOAuthProvider(provider: EmailProvider): OAuthProvider {
  switch (provider) {
    case 'gmail':
      return new GoogleOAuthProvider()
    case 'outlook':
      return new MicrosoftOAuthProvider()
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`)
  }
}

// Generate a secure random state parameter
export function generateOAuthState(): string {
  const array = new Uint8Array(32)
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array)
  } else {
    // Server-side
    const crypto = require('crypto')
    crypto.randomFillSync(array)
  }
  return Buffer.from(array).toString('base64url')
}