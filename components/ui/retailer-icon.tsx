import React from 'react'
import Image from 'next/image'
import { ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRetailerBlurPlaceholder } from '@/lib/utils/image-utils'

// Map retailer names to image files
const retailerImageMap: Record<string, string> = {
  'bol.com': 'bol.svg',
  'coolblue': 'coolblue.svg',
  'amazon.nl': 'amazon.svg',
  'amazon': 'amazon.svg',
  'zalando': 'zalando.svg',
  'mediamarkt': 'mediamarkt.svg',
  'albert heijn': 'albert-heijn.svg',
  'hema': 'hema.svg',
  'decathlon': 'decathlon.svg',
  'asos': 'asos.svg',
  'wehkamp': 'wehkamp.svg'
}

interface RetailerIconProps {
  retailer: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showName?: boolean
}

export function RetailerIcon({ retailer, size = 'md', className, showName = false }: RetailerIconProps) {
  const sizeMap = {
    sm: { size: 24, className: 'w-6 h-6' },
    md: { size: 32, className: 'w-8 h-8' },
    lg: { size: 40, className: 'w-10 h-10' },
    xl: { size: 48, className: 'w-12 h-12' }
  }

  const { size: imageSize, className: sizeClassName } = sizeMap[size]
  const normalizedRetailer = retailer.toLowerCase().trim()
  const imageFile = retailerImageMap[normalizedRetailer]

  if (imageFile) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('flex-shrink-0 rounded-lg overflow-hidden', sizeClassName)}>
          <Image
            src={`/images/retailers/${imageFile}`}
            alt={`${retailer} logo`}
            width={imageSize}
            height={imageSize}
            placeholder="blur"
            blurDataURL={getRetailerBlurPlaceholder(retailer)}
            className="object-cover"
            priority={size === 'lg' || size === 'xl'} // Prioritize larger images
          />
        </div>
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
          sizeClassName
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