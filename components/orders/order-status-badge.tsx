import { Badge } from '@/components/ui/badge'
import { getStatusConfig, getStatusColor, type OrderStatus } from '@/lib/utils/status-formatter'
import { cn } from '@/lib/utils'

interface OrderStatusBadgeProps {
  status: OrderStatus
  language?: 'en' | 'nl'
  showIcon?: boolean
  className?: string
}

export function OrderStatusBadge({ 
  status, 
  language = 'en', 
  showIcon = true,
  className 
}: OrderStatusBadgeProps) {
  const config = getStatusConfig(status)
  const label = language === 'nl' ? config.labelNL : config.label
  const colorClasses = getStatusColor(status)
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium',
        colorClasses,
        className
      )}
    >
      {showIcon && (
        <span className="mr-1 text-xs" role="img" aria-label={`${status} status`}>
          {config.icon}
        </span>
      )}
      {label}
    </Badge>
  )
}