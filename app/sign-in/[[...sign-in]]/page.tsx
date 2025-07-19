'use client'

import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      
      <div className="flex min-h-screen items-center justify-center p-6 relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-display text-gradient mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to your WhatDidiShop account</p>
          </div>
          
          <SignIn 
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            appearance={{
              variables: {
                colorPrimary: '#4F46E5',
                colorText: 'hsl(var(--foreground))',
                colorTextSecondary: 'hsl(var(--muted-foreground))',
                colorBackground: 'transparent',
                colorInputBackground: 'hsl(var(--background))',
                colorInputText: 'hsl(var(--foreground))',
                borderRadius: '12px',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              },
              elements: {
                rootBox: "mx-auto",
                card: "glass-card border-white/20 backdrop-blur-xl shadow-glow",
                headerTitle: "text-2xl font-bold font-display text-gradient",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton: "border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300",
                formButtonPrimary: "bg-gradient-primary hover:shadow-glow hover:scale-105 transition-all duration-300",
                formFieldInput: "border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 bg-background/50 backdrop-blur-sm",
                footerActionLink: "text-primary hover:text-primary/80 font-medium",
                dividerLine: "bg-border/50",
                dividerText: "text-muted-foreground bg-background/80 backdrop-blur-sm",
                identityPreviewText: "text-foreground",
                identityPreviewEditButton: "text-primary hover:text-primary/80"
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  )
}