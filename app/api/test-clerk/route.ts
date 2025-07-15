import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    // Test Clerk auth
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        timestamp: new Date().toISOString()
      })
    }
    
    // Test currentUser function
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({
        success: false,
        error: 'Clerk user not found',
        userId,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Clerk integration working',
      userId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
      name: clerkUser.firstName || clerkUser.lastName || 'No name',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Clerk test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Clerk test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}