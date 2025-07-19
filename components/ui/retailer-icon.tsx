import React from 'react'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'

const retailerLogos: Record<string, string> = {
  'bol.com': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0f7fda"/>
      <text x="50" y="65" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">bol</text>
    </svg>
  `,
  'coolblue': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0077be"/>
      <circle cx="50" cy="40" r="15" fill="white"/>
      <text x="50" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">coolblue</text>
    </svg>
  `,
  'amazon.nl': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#232f3e"/>
      <text x="50" y="45" text-anchor="middle" fill="#ff9900" font-family="Arial, sans-serif" font-size="20" font-weight="bold">amazon</text>
      <path d="M20 70 Q50 80 80 70" stroke="#ff9900" stroke-width="3" fill="none"/>
    </svg>
  `,
  'zalando': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#ff6900"/>
      <text x="50" y="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">Z</text>
    </svg>
  `,
  'mediamarkt': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#e30613"/>
      <text x="50" y="45" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Media</text>
      <text x="50" y="65" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">Markt</text>
    </svg>
  `,
  'albert heijn': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0074d9"/>
      <text x="50" y="45" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">AH</text>
      <circle cx="50" cy="65" r="8" fill="white"/>
    </svg>
  `,
  'hema': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#d8232a"/>
      <text x="50" y="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="22" font-weight="bold">HEMA</text>
    </svg>
  `,
  'decathlon': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#0082c3"/>
      <polygon points="35,30 65,30 50,60" fill="white"/>
      <text x="50" y="80" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="10" font-weight="bold">DECATHLON</text>
    </svg>
  `,
  'asos': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#000000"/>
      <text x="50" y="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="20" font-weight="bold">ASOS</text>
    </svg>
  `,
  'wehkamp': `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="20" fill="#e31837"/>
      <text x="50" y="60" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" font-weight="bold">W</text>
    </svg>
  `
}

interface RetailerIconProps {
  retailer: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showName?: boolean
}

export function RetailerIcon({ retailer, size = 'md', className, showName = false }: RetailerIconProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }

  const normalizedRetailer = retailer.toLowerCase().trim()
  const logoSvg = retailerLogos[normalizedRetailer]

  if (logoSvg) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div 
          className={cn('flex-shrink-0 rounded-lg overflow-hidden', sizeClasses[size])}
          dangerouslySetInnerHTML={{ __html: logoSvg }}
          role="img"
          aria-label={`${retailer} logo`}
        />
        {showName && (
          <span className="font-medium text-foreground">{retailer}</span>
        )}
      </div>
    )
  }

  // Fallback for unknown retailers
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div 
        className={cn(
          'flex-shrink-0 rounded-lg bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center border border-border/50',
          sizeClasses[size]
        )}
        role="img"
        aria-label={`${retailer} retailer icon`}
      >
        <ShoppingBag 
          className={cn(
            'text-muted-foreground',
            size === 'sm' && 'w-3 h-3',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-5 h-5',
            size === 'xl' && 'w-6 h-6'
          )}
          aria-hidden="true"
        />
      </div>
      {showName && (
        <span className="font-medium text-foreground">{retailer}</span>
      )}
    </div>
  )
}