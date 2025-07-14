'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpVerifyPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard since verification was already handled by Clerk
    router.push('/dashboard')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-lg">Email verified successfully! Redirecting to dashboard...</p>
      </div>
    </div>
  )
}