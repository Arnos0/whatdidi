import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { ApiErrors } from '@/lib/utils/api-errors'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return ApiErrors.unauthorized()
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return ApiErrors.notFound('User')
    }

    // Get email accounts for user (tokens will be encrypted)
    const accounts = await serverEmailAccountQueries.getByUserId(user.id)
    
    // Remove sensitive data before sending to client
    const sanitizedAccounts = accounts.map(account => ({
      id: account.id,
      provider: account.provider,
      email: account.email,
      scan_enabled: account.scan_enabled,
      last_scan_at: account.last_scan_at,
      created_at: account.created_at,
      updated_at: account.updated_at
    }))

    return NextResponse.json({ accounts: sanitizedAccounts })

  } catch (error) {
    return ApiErrors.serverError(error)
  }
}