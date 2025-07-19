import { cn } from '@/lib/utils'

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse'
}

export function Skeleton({ 
  className, 
  variant = 'shimmer',
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-muted',
        variant === 'shimmer' && 'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
        variant === 'pulse' && 'animate-pulse',
        variant === 'default' && '',
        className
      )}
      {...props}
    />
  )
}

export function OrderCardSkeleton() {
  return (
    <div className="space-y-4">
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block">
        <div className="rounded-lg border bg-card">
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-6">
                  <Skeleton className="h-4 w-24" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card Skeleton */}
      <div className="md:hidden space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}