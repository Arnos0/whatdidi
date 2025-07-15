import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { MicrosoftOAuthProvider, tokenEncryption } from '@/lib/oauth/oauth-service'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { oAuthCallbackSchema } from '@/lib/validation/email-accounts'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.redirect(new URL('/sign-in?error=unauthorized', request.url))
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.redirect(new URL('/dashboard?error=user_not_found', request.url))
    }

    // Parse and validate callback parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const validationResult = oAuthCallbackSchema.safeParse(searchParams)
    
    if (!validationResult.success) {
      return NextResponse.redirect(new URL('/settings?error=invalid_callback', request.url))
    }

    const { code, state, error, error_description } = validationResult.data

    // Handle OAuth errors
    if (error) {
      return NextResponse.redirect(new URL(`/settings?error=${error}&description=${error_description || ''}`, request.url))
    }

    // Verify state parameter
    const storedState = cookies().get('oauth_state')?.value
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(new URL('/settings?error=invalid_state', request.url))
    }

    // Clear state cookie
    cookies().delete('oauth_state')

    // Exchange code for tokens
    const provider = new MicrosoftOAuthProvider()
    const tokens = await provider.exchangeCodeForTokens(code)

    // Get user email
    const email = await provider.getUserEmail(tokens.access_token)

    // Check if account already exists
    const existingAccount = await serverEmailAccountQueries.findByUserEmail(user.id, email)
    
    if (existingAccount) {
      // Update existing account with new tokens
      await serverEmailAccountQueries.updateTokens(
        existingAccount.id,
        user.id,
        {
          access_token: tokenEncryption.encrypt(tokens.access_token),
          refresh_token: tokens.refresh_token ? tokenEncryption.encrypt(tokens.refresh_token) : undefined,
          token_expires_at: tokens.expires_in 
            ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
            : undefined
        }
      )
    } else {
      // Create new email account
      await serverEmailAccountQueries.create({
        user_id: user.id,
        provider: 'outlook',
        email,
        access_token: tokenEncryption.encrypt(tokens.access_token),
        refresh_token: tokens.refresh_token ? tokenEncryption.encrypt(tokens.refresh_token) : undefined,
        token_expires_at: tokens.expires_in 
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : undefined,
        scan_enabled: true
      })
    }

    // Redirect to settings with success message
    return NextResponse.redirect(new URL('/settings?success=email_connected', request.url))

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=oauth_failed', request.url))
  }
}