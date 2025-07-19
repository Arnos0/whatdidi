import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  showCard?: boolean
  variant?: 'default' | 'table' | 'grid' | 'form'
}

export function LoadingSkeleton({ 
  className, 
  lines = 3, 
  showCard = true, 
  variant = 'default' 
}: LoadingSkeletonProps) {
  const content = (
    <div className={cn("animate-pulse space-y-3", className)}>
      {variant === 'table' && (
        <>
          <div className="h-4 bg-muted rounded w-full"></div>
          {[...Array(lines)].map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-4">
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </>
      )}
      
      {variant === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(lines)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </div>
          ))}
        </div>
      )}
      
      {variant === 'form' && (
        <div className="space-y-4">
          {[...Array(lines)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-muted rounded w-1/4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      )}
      
      {variant === 'default' && (
        <>
          <div className="h-4 bg-muted rounded w-3/4"></div>
          {[...Array(lines - 1)].map((_, i) => (
            <div key={i} className="h-3 bg-muted rounded w-full"></div>
          ))}
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </>
      )}
    </div>
  )

  if (showCard) {
    return <Card className="p-6">{content}</Card>
  }

  return content
}

// Specific skeleton components for common use cases
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return <LoadingSkeleton variant="table" lines={rows} />
}

export function GridSkeleton({ items = 6 }: { items?: number }) {
  return <LoadingSkeleton variant="grid" lines={items} showCard={false} />
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return <LoadingSkeleton variant="form" lines={fields} />
}