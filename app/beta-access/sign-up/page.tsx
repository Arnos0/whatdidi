import { SignUp } from '@clerk/nextjs'
import { Badge } from '@/components/ui/badge'
import { AuthCard } from '@/components/ui/auth-card'
import { CheckCircle } from 'lucide-react'

export default function BetaSignUpPage() {
  return (
    <AuthCard
      title="Create your beta account"
      description="Welcome to the WhatDidiShop beta program"
    >
      <div className="text-center mb-6">
        <Badge variant="secondary" className="mb-4">
          <CheckCircle className="w-3 h-3 mr-1" />
          Beta Access
        </Badge>
      </div>
      <SignUp 
        path="/beta-access/sign-up"
        routing="path"
        signInUrl="/sign-in"
      />
    </AuthCard>
  )
}