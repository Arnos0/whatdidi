import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { serverUserQueries } from '@/lib/supabase/server-queries'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Clerk user not found' }, { status: 404 })
    }

    const user = await serverUserQueries.syncFromClerk({
      id: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses.map(email => ({ 
        emailAddress: email.emailAddress 
      })),
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Sync user error:', error)
    return NextResponse.json(
      { error: 'Failed to sync user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}