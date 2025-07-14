'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function DropdownMenu({ trigger, children, className }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Validate event target exists and is a Node
      if (!event.target || !(event.target instanceof Node)) {
        return
      }
      
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    // Only add listener if dropdown is open
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, { passive: true })
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {isOpen && (
        <div className={cn(
          'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50',
          className
        )}>
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function DropdownMenuItem({ children, onClick, className }: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900',
        className
      )}
    >
      {children}
    </button>
  )
}

interface DropdownMenuSeparatorProps {
  className?: string
}

export function DropdownMenuSeparator({ className }: DropdownMenuSeparatorProps) {
  return (
    <div className={cn('border-t border-gray-100 my-1', className)} />
  )
}