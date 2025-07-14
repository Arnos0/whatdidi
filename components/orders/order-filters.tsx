'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, Calendar } from 'lucide-react'

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

export function OrderFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [dateRange, setDateRange] = useState('all')
  const [customDateFrom, setCustomDateFrom] = useState(searchParams.get('dateFrom') || '')
  const [customDateTo, setCustomDateTo] = useState(searchParams.get('dateTo') || '')

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams)
    
    // Update search
    if (search) {
      params.set('search', search)
    } else {
      params.delete('search')
    }
    
    // Update status
    if (status && status !== 'all') {
      params.set('status', status)
    } else {
      params.delete('status')
    }
    
    // Update date range
    if (dateRange && dateRange !== 'all' && dateRange !== 'custom') {
      const days = parseInt(dateRange)
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
      params.set('dateFrom', dateFrom.toISOString().split('T')[0])
      params.delete('dateTo')
    } else if (dateRange === 'custom') {
      if (customDateFrom) params.set('dateFrom', customDateFrom)
      if (customDateTo) params.set('dateTo', customDateTo)
    } else {
      params.delete('dateFrom')
      params.delete('dateTo')
    }
    
    // Reset to page 1 when filters change
    params.set('page', '1')
    
    router.push(`/orders?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setDateRange('all')
    setCustomDateFrom('')
    setCustomDateTo('')
    router.push('/orders')
  }

  const hasActiveFilters = search || (status && status !== 'all') || (dateRange && dateRange !== 'all') || customDateFrom || customDateTo

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Order # or retailer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="pl-8"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-2">
          <Label htmlFor="dateRange">Date Range</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger id="dateRange">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Actions */}
        <div className="flex items-end gap-2">
          <Button onClick={applyFilters} className="flex-1">
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              size="icon"
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Custom Date Range */}
      {dateRange === 'custom' && (
        <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">From Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateFrom"
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">To Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateTo"
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}