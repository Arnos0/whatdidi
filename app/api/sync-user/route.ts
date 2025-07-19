import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { serverUserQueries } from '@/lib/supabase/server-queries'
import { ApiErrors } from '@/lib/utils/api-errors'

export async function POST() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return ApiErrors.unauthorized()
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return ApiErrors.notFound('User')
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
    return ApiErrors.serverError(error)
  }
}