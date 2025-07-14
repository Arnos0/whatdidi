'use client'

import { useState } from 'react'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { UserButton } from '@clerk/nextjs'
import { DashboardErrorBoundary } from './error-boundary'

interface LayoutWrapperProps {
  children: React.ReactNode
  variant?: 'horizontal' | 'sidebar'
}

export function LayoutWrapper({ children, variant = 'horizontal' }: LayoutWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  if (variant === 'sidebar') {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header for sidebar layout */}
          <div className="bg-card shadow-sm border-b px-6 py-4 h-16">
            <div className="flex items-center justify-between h-full">
              <div></div> {/* Spacer */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <DashboardErrorBoundary>
                {children}
              </DashboardErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Default horizontal layout
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <DashboardErrorBoundary>
          {children}
        </DashboardErrorBoundary>
      </main>
    </div>
  )
}