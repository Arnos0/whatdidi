'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/ui/auth-card'
import { Mail, Check } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Store email in actual waitlist system
    // For now, just set submitted state - email is stored in component state
    setSubmitted(true)
  }

  return (
    <AuthCard 
      title="Join the Waitlist" 
      description="Sign-ups are currently invite-only"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-lg font-semibold mb-2">
          Get notified when we launch!
        </h2>
        <p className="text-muted-foreground text-sm">
          Join our waitlist to get early access to WhatDidiShop when we open to the public.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
          </div>
          <Button type="submit" className="w-full">
            Join Waitlist
          </Button>
        </form>
      ) : (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            You&apos;re on the list!
          </h3>
          <p className="text-muted-foreground text-sm">
            We&apos;ll notify you when WhatDidiShop is ready for everyone.
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>
      </div>
    </AuthCard>
  )
}