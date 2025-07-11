import Link from 'next/link'
import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen-safe pt-16">
        <Container>
          <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                Never lose track of what you bought
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                WhatDidiShop automatically tracks all your online purchases and deliveries in one place. 
                Connect your email, and we&apos;ll do the rest.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button asChild>
                  <Link href="/sign-up">
                    Get started
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">
                    Sign in <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}