import { SignIn } from '@clerk/nextjs'
import { AuthCard } from '@/components/ui/auth-card'

export default function SignInPage() {
  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your WhatDidiShop account"
    >
      <SignIn />
    </AuthCard>
  )
}