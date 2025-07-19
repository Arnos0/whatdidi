'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  ShoppingBag, 
  Settings, 
  Menu, 
  X,
  Mail,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Package,
  UserCircle,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'from-blue-500 to-blue-600' },
  { name: 'Orders', href: '/orders', icon: ShoppingBag, color: 'from-purple-500 to-purple-600' },
  { name: 'Email Accounts', href: '/email-accounts', icon: Mail, color: 'from-green-500 to-green-600' },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, color: 'from-orange-500 to-orange-600' },
  { name: 'Settings', href: '/settings', icon: Settings, color: 'from-gray-500 to-gray-600' },
]

interface SidebarProps {
  collapsed?: boolean
  onToggle?: (collapsed: boolean) => void
  onNavigate?: () => void
}

export function Sidebar({ collapsed = false, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)
  const [isHovered, setIsHovered] = useState(false)
  const { signOut } = useAuth()

  const handleToggle = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onToggle?.(newCollapsed)
  }

  const shouldExpand = isCollapsed && isHovered

  return (
    <TooltipProvider>
      <motion.div 
        className={cn(
          'relative glass-card bg-background/80 backdrop-blur-xl shadow-xl border-r transition-all duration-300 ease-in-out',
          isCollapsed && !shouldExpand ? 'w-20' : 'w-72'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ width: isCollapsed && !shouldExpand ? 80 : 288 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 h-16">
            <AnimatePresence mode="wait">
              {(!isCollapsed || shouldExpand) && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3"
                >
                  <motion.div 
                    className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Package className="h-5 w-5 text-white" />
                  </motion.div>
                  <span className="text-xl font-bold font-display text-gradient">
                    WhatDidiShop
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            {(!isCollapsed || shouldExpand) && (
              <Button
                onClick={handleToggle}
                variant="ghost"
                size="icon"
                className="ml-auto hover:bg-white/10"
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.div>
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-custom">
            {navigation.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'group relative flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                          isActive
                            ? 'bg-gradient-primary text-white shadow-glow'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                        )}
                      >
                        <motion.div
                          className={cn(
                            'flex items-center justify-center rounded-lg p-2',
                            isActive ? 'bg-white/20' : 'bg-gradient-to-br ' + item.color + ' opacity-0 group-hover:opacity-100'
                          )}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className={cn(
                            'h-5 w-5',
                            isActive ? 'text-white' : 'text-white mix-blend-normal'
                          )} />
                        </motion.div>
                        
                        <AnimatePresence>
                          {(!isCollapsed || shouldExpand) && (
                            <motion.span
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                              className="ml-3"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                        
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && !shouldExpand && (
                      <TooltipContent side="right" className="glass-card px-3 py-2 text-sm">
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </motion.div>
              )
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-white/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-xl bg-white/5',
                isCollapsed && !shouldExpand ? 'justify-center' : ''
              )}>
                <motion.div
                  className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center"
                  whileHover={{ scale: 1.1 }}
                >
                  <UserCircle className="h-6 w-6 text-white" />
                </motion.div>
                
                <AnimatePresence>
                  {(!isCollapsed || shouldExpand) && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex-1"
                    >
                      <p className="text-sm font-medium">User</p>
                      <p className="text-xs text-muted-foreground">user@example.com</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {(!isCollapsed || shouldExpand) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start hover:bg-white/10"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        
        {/* Collapse Button for collapsed state */}
        {isCollapsed && !shouldExpand && (
          <Button
            onClick={handleToggle}
            variant="ghost"
            size="icon"
            className="absolute top-20 -right-4 bg-background border shadow-lg hover:shadow-xl z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </motion.div>
    </TooltipProvider>
  )
}