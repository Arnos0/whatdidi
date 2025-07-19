'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Trash2, 
  Download,
  RefreshCw,
  Filter
} from 'lucide-react'
import { useErrorTracking } from '@/lib/utils/error-tracking'
import type { ErrorReport } from '@/lib/utils/error-tracking'

export function ErrorDashboard() {
  const { getReports, getErrorStats, clearReports } = useErrorTracking()
  const [reports, setReports] = useState<ErrorReport[]>([])
  const [stats, setStats] = useState<any>({})
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    refreshData()
  }, [filter])

  const refreshData = () => {
    const allReports = getReports()
    const filteredReports = filter === 'all' 
      ? allReports
      : allReports.filter(r => r.severity === filter)
    
    setReports(filteredReports)
    setStats(getErrorStats())
  }

  const getSeverityIcon = (severity: ErrorReport['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: ErrorReport['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const exportData = () => {
    const data = {
      reports,
      stats,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-reports-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Error Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              clearReports()
              refreshData()
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Errors</p>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Critical</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.bySeverity?.critical || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">High</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.bySeverity?.high || 0}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Recent (1h)</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.recent || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter by severity:</span>
        {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
          <Button
            key={severity}
            variant={filter === severity ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(severity)}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </Button>
        ))}
      </div>

      {/* Error Reports */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No error reports found</p>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(report.severity)}
                    <div>
                      <h3 className="font-medium">{report.error.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {report.error.message}
                      </p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(report.severity)}>
                    {report.severity}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Component:</span>{' '}
                    {report.context.component || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Action:</span>{' '}
                    {report.context.action || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{' '}
                    {new Date(report.context.timestamp).toLocaleString()}
                  </div>
                </div>

                {report.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {report.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {report.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                      {report.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}