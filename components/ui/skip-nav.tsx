'use client'

import { cn } from '@/lib/utils'

interface SkipNavProps {
  href?: string
  children: React.ReactNode
  className?: string
}

export function SkipNav({ href = '#main-content', children, className }: SkipNavProps) {
  return (
    <a
      href={href}
      className={cn(
        // Position off-screen by default
        'absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden',
        // When focused, bring into view
        'focus:left-6 focus:top-6 focus:w-auto focus:h-auto focus:overflow-visible',
        // Styling when visible
        'focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:z-50',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
      tabIndex={0}
    >
      {children}
    </a>
  )
}

export function SkipNavLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <SkipNav href="#main-content">
        Skip to main content
      </SkipNav>
      <SkipNav href="#primary-navigation">
        Skip to navigation
      </SkipNav>
    </div>
  )
}