import { Badge } from '@/components/ui/badge'
import { Mail, Edit3, AlertCircle } from 'lucide-react'

interface OrderSourceIndicatorProps {
  isManual: boolean
  needsReview?: boolean
  className?: string
}

export function OrderSourceIndicator({ 
  isManual, 
  needsReview = false, 
  className = '' 
}: OrderSourceIndicatorProps) {
  if (needsReview) {
    return (
      <Badge 
        variant="outline" 
        className={`border-orange-200 text-orange-700 bg-orange-50 ${className}`}
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Needs Review
      </Badge>
    )
  }

  if (isManual) {
    return (
      <Badge 
        variant="outline" 
        className={`border-blue-200 text-blue-700 bg-blue-50 ${className}`}
      >
        <Edit3 className="h-3 w-3 mr-1" />
        Manual
      </Badge>
    )
  }

  return (
    <Badge 
      variant="outline" 
      className={`border-green-200 text-green-700 bg-green-50 ${className}`}
    >
      <Mail className="h-3 w-3 mr-1" />
      Email
    </Badge>
  )
}