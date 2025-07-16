'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { DateRange, ScanType, EmailScanJob } from '@/lib/types/email'

interface ScanOptions {
  dateRange: DateRange
  scanType: ScanType
}

async function startEmailScan(accountId: string, options: ScanOptions) {
  const response = await fetch(`/api/email-accounts/${accountId}/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to start email scan')
  }

  return response.json()
}

async function getScanStatus(accountId: string) {
  const response = await fetch(`/api/email-accounts/${accountId}/scan`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get scan status')
  }

  return response.json()
}

export function useStartEmailScan(accountId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options: ScanOptions) => startEmailScan(accountId, options),
    onSuccess: () => {
      toast.success('Email scan started successfully')
      // Invalidate scan status query
      queryClient.invalidateQueries({ queryKey: ['scan-status', accountId] })
      // Invalidate orders to show new ones
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useScanStatus(accountId: string, enabled = true) {
  return useQuery({
    queryKey: ['scan-status', accountId],
    queryFn: () => getScanStatus(accountId),
    enabled,
    refetchInterval: (query) => {
      // Poll while scan is running
      const status = query.state.data?.scanJob?.status
      if (status === 'running' || status === 'pending') {
        return 2000 // Poll every 2 seconds
      }
      return false // Stop polling
    },
  })
}

export function getScanStatusDisplay(scanJob: EmailScanJob | null): {
  label: string
  description: string
  isRunning: boolean
  progress: number
} {
  if (!scanJob) {
    return {
      label: 'No scans',
      description: 'No email scans have been performed yet',
      isRunning: false,
      progress: 0,
    }
  }

  const progress = scanJob.emails_found > 0 
    ? (scanJob.emails_processed / scanJob.emails_found) * 100 
    : 0

  switch (scanJob.status) {
    case 'pending':
      return {
        label: 'Scan pending',
        description: 'Email scan is queued and will start soon',
        isRunning: true,
        progress: 0,
      }
    
    case 'running':
      return {
        label: 'Scanning emails',
        description: `Processing ${scanJob.emails_processed} of ${scanJob.emails_found} emails`,
        isRunning: true,
        progress,
      }
    
    case 'completed':
      return {
        label: 'Scan complete',
        description: `Found ${scanJob.orders_created} orders from ${scanJob.emails_found} emails`,
        isRunning: false,
        progress: 100,
      }
    
    case 'failed':
      return {
        label: 'Scan failed',
        description: scanJob.last_error || 'An error occurred during scanning',
        isRunning: false,
        progress,
      }
    
    case 'cancelled':
      return {
        label: 'Scan cancelled',
        description: 'Email scan was cancelled',
        isRunning: false,
        progress,
      }
    
    default:
      return {
        label: 'Unknown status',
        description: 'Unknown scan status',
        isRunning: false,
        progress: 0,
      }
  }
}