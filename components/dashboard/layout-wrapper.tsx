'use client'

import { useState, useEffect } from 'react'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { UserButton } from '@clerk/nextjs'
import { DashboardErrorBoundary } from './error-boundary'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LayoutWrapperProps {
  children: React.ReactNode
  variant?: 'horizontal' | 'sidebar'
}

export function LayoutWrapper({ children, variant = 'horizontal' }: LayoutWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (variant === 'sidebar') {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block" id="primary-navigation">
          <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
        </div>
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed left-0 top-0 h-full w-80 max-w-[80vw]">
              <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header for sidebar layout */}
          <div className="bg-card shadow-sm border-b px-4 md:px-6 py-4 h-16">
            <div className="flex items-center justify-between h-full">
              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="hover:bg-muted"
                >
                  {mobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
              
              {/* Desktop spacer */}
              <div className="hidden md:block"></div>
              
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
          <main className="flex-1 overflow-y-auto" id="main-content">
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
      <div id="primary-navigation">
        <Navbar />
      </div>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" id="main-content">
        <DashboardErrorBoundary>
          {children}
        </DashboardErrorBoundary>
      </main>
    </div>
  )
}