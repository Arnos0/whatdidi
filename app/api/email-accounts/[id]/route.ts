import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries, serverEmailAccountQueries } from '@/lib/supabase/server-queries'
import { emailAccountIdSchema } from '@/lib/validation/email-accounts'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Validate account ID
    const validationResult = emailAccountIdSchema.safeParse({ id: params.id })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid account ID' },
        { status: 400 }
      )
    }

    // Delete email account
    await serverEmailAccountQueries.delete(params.id, user.id)

    return NextResponse.json({ success: true })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete email account' },
      { status: 500 }
    )
  }
}