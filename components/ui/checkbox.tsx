'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate ?? false
      }
    }, [indeterminate])

    return (
      <div className="relative">
        <input
          type="checkbox"
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
            className
          )}
          ref={(node) => {
            if (node) {
              inputRef.current = node
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }
          }}
          {...props}
        />
        <Check className={cn(
          'absolute top-0 left-0 h-4 w-4 pointer-events-none',
          'opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100',
          'text-primary-foreground'
        )} />
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }