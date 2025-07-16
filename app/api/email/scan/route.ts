import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { z } from 'zod'

const scanRequestSchema = z.object({
  dateRange: z.enum(['1_week', '2_weeks', '1_month', '3_months', '6_months']).optional().default('1_month'),
  scanType: z.enum(['full', 'incremental']).optional().default('incremental'),
  accountId: z.string().uuid().optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json().catch(() => ({}))
    const validation = scanRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Invalid request parameters',
        details: validation.error.errors 
      }, { status: 400 })
    }

    const { dateRange, scanType, accountId } = validation.data

    // Get email accounts
    let emailAccounts
    if (accountId) {
      // Scan specific account
      const account = await serverEmailAccountQueries.getById(accountId, user.id)
      if (!account) {
        return NextResponse.json({ error: 'Email account not found' }, { status: 404 })
      }
      emailAccounts = [account]
    } else {
      // Scan all active accounts
      emailAccounts = await serverEmailAccountQueries.getByUserId(user.id)
      emailAccounts = emailAccounts.filter(account => account.scan_enabled)
    }

    if (emailAccounts.length === 0) {
      return NextResponse.json({ 
        error: 'No active email accounts found. Please connect an email account first.' 
      }, { status: 400 })
    }

    // Start scan jobs for each account
    const scanJobs = []
    
    for (const account of emailAccounts) {
      // Forward the request to the account-specific scan endpoint
      const response = await fetch(`${request.nextUrl.origin}/api/email-accounts/${account.id}/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({ dateRange, scanType })
      })

      if (response.ok) {
        const data = await response.json()
        scanJobs.push({
          accountId: account.id,
          email: account.email,
          ...data.scanJob
        })
      } else {
        const error = await response.text()
        scanJobs.push({
          accountId: account.id,
          email: account.email,
          error: `Failed to start scan: ${error}`
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Started scanning ${scanJobs.length} email account(s)`,
      scanJobs
    })

  } catch (error) {
    console.error('Email scan error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Get scan status for all accounts
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all email accounts
    const emailAccounts = await serverEmailAccountQueries.getByUserId(user.id)
    
    // Get latest scan job for each account
    const scanStatuses = []
    
    for (const account of emailAccounts) {
      const response = await fetch(`${request.nextUrl.origin}/api/email-accounts/${account.id}/scan`, {
        method: 'GET',
        headers: {
          'Cookie': request.headers.get('cookie') || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.scanJob) {
          scanStatuses.push({
            accountId: account.id,
            email: account.email,
            ...data.scanJob
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      scanJobs: scanStatuses
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch scan status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}