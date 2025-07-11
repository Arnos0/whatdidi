import { Header } from '@/components/ui/header'
import { Footer } from '@/components/ui/footer'
import { Container } from '@/components/ui/container'

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen-safe pt-16">
        <Container>
          <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-12">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Never lose track of what you bought
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                WhatDidiShop automatically tracks all your online purchases and deliveries in one place. 
                Connect your email, and we&apos;ll do the rest.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <a
                  href="/sign-up"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Get started
                </a>
                <a href="/sign-in" className="text-sm font-semibold leading-6 text-gray-900">
                  Sign in <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  )
}