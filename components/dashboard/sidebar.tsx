'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Home, 
  ShoppingBag, 
  Settings, 
  Menu, 
  X,
  Mail,
  TrendingUp 
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Email Accounts', href: '/email-accounts', icon: Mail },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: (collapsed: boolean) => void
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  const handleToggle = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onToggle?.(newCollapsed)
  }

  return (
    <div className={cn(
      'bg-card shadow-sm border-r transition-all duration-300 ease-in-out',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b h-16">
          {!isCollapsed && (
            <span className="text-xl font-bold text-foreground">
              WhatDidiShop
            </span>
          )}
          <button
            onClick={handleToggle}
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            {isCollapsed ? (
              <Menu className="h-5 w-5 text-muted-foreground" />
            ) : (
              <X className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground border-r-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn('h-5 w-5', isCollapsed ? 'mx-auto' : 'mr-3')} />
                {!isCollapsed && item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <div className={cn(
            'text-xs text-muted-foreground',
            isCollapsed ? 'text-center' : ''
          )}>
            {isCollapsed ? 'WDS' : 'WhatDidiShop'}
          </div>
        </div>
      </div>
    </div>
  )
}