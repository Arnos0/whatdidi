import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { MicrosoftOAuthProvider, generateOAuthState } from '@/lib/oauth/oauth-service'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate state parameter for CSRF protection
    const state = generateOAuthState()
    
    // Store state in a secure, httpOnly cookie
    cookies().set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    })

    // Get authorization URL
    const provider = new MicrosoftOAuthProvider()
    const authUrl = provider.getAuthorizationUrl(state)

    // Redirect to Microsoft OAuth
    return NextResponse.redirect(authUrl)

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}