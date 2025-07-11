import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { Container } from './container'

export function Header() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">WhatDidiShop</span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
            >
              Pricing
            </Link>
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Get Started
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </Container>
    </header>
  )
}