import { ChevronRightIcon } from 'lucide-react'
import { ReactNode } from 'react'
import Link from 'next/link'

// Validate internal URL paths
const isValidInternalPath = (path: string): boolean => {
  if (!path || typeof path !== 'string') return false
  
  // Must start with /
  if (!path.startsWith('/')) return false
  
  // Allowed paths (whitelist approach)
  const allowedPaths = [
    '/dashboard',
    '/orders',
    '/settings',
    '/analytics',
    '/email-accounts'
  ]
  
  return allowedPaths.includes(path)
}

interface BreadcrumbItem {
  name: string
  href?: string
}

interface DashboardHeaderProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: ReactNode
}

export function DashboardHeader({ title, breadcrumbs = [], actions }: DashboardHeaderProps) {
  return (
    <div className="bg-card shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {breadcrumbs.length > 0 && (
            <nav className="flex mb-4" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                {breadcrumbs.map((item, index) => (
                  <li key={item.name} className="flex items-center">
                    {index > 0 && (
                      <ChevronRightIcon className="h-4 w-4 text-muted-foreground mx-2" />
                    )}
                    {item.href && isValidInternalPath(item.href) ? (
                      <Link
                        href={item.href}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-foreground">
                        {item.name}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {actions && (
              <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}