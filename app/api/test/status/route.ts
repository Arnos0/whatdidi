import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server-client'
import { tokenEncryption } from '@/lib/oauth/oauth-service'

export async function GET(request: NextRequest) {
  const status: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 3000,
    checks: {}
  }

  // 1. Check environment variables
  status.checks.environment = {
    CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
    TOKEN_ENCRYPTION_KEY: !!process.env.TOKEN_ENCRYPTION_KEY,
    SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  // 2. Check database connectivity
  try {
    const supabase = createServerClient()
    const { count, error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
    
    status.checks.database = {
      connected: !error,
      userCount: count || 0,
      error: error?.message
    }
  } catch (e: any) {
    status.checks.database = {
      connected: false,
      error: e.message
    }
  }

  // 3. Check encryption
  try {
    const test = 'test_string'
    const encrypted = tokenEncryption.encrypt(test)
    const decrypted = tokenEncryption.decrypt(encrypted)
    
    status.checks.encryption = {
      working: test === decrypted,
      keyLength: process.env.TOKEN_ENCRYPTION_KEY?.length || 0
    }
  } catch (e: any) {
    status.checks.encryption = {
      working: false,
      error: e.message
    }
  }

  // 4. Check API routes
  const routes = [
    '/api/health',
    '/api/email/scan',
    '/api/test/encryption'
  ]
  
  status.checks.routes = {}
  for (const route of routes) {
    try {
      const url = `${request.nextUrl.origin}${route}`
      const response = await fetch(url, {
        method: route.includes('scan') ? 'POST' : 'GET',
        headers: route.includes('scan') ? { 'Content-Type': 'application/json' } : {}
      })
      status.checks.routes[route] = {
        status: response.status,
        ok: response.ok || response.status === 401 // 401 is expected for protected routes
      }
    } catch (e) {
      status.checks.routes[route] = {
        status: 0,
        ok: false,
        error: 'Failed to connect'
      }
    }
  }

  // 5. Summary
  const allChecks = [
    Object.values(status.checks.environment).every(v => v === true || typeof v === 'string'),
    status.checks.database?.connected,
    status.checks.encryption?.working,
    Object.values(status.checks.routes).every((r: any) => r.ok)
  ]
  
  status.healthy = allChecks.every(check => check === true)
  status.summary = {
    total: allChecks.length,
    passed: allChecks.filter(c => c === true).length,
    failed: allChecks.filter(c => c !== true).length
  }

  return NextResponse.json(status, { 
    status: status.healthy ? 200 : 500 
  })
}