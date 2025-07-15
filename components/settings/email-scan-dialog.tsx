'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import type { DateRange, ScanType } from '@/lib/types/email'
import { useStartEmailScan, useScanStatus, getScanStatusDisplay } from '@/hooks/use-email-scan'

interface EmailScanDialogProps {
  accountId: string
  email: string
  provider: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const dateRangeOptions: { value: DateRange; label: string; description: string }[] = [
  { value: '1_month', label: 'Last month', description: 'Scan emails from the last 30 days' },
  { value: '3_months', label: 'Last 3 months', description: 'Scan emails from the last 90 days' },
  { value: '6_months', label: 'Last 6 months', description: 'Recommended for first scan' },
  { value: '1_year', label: 'Last year', description: 'Scan emails from the last 365 days' },
  { value: '2_years', label: 'Last 2 years', description: 'Scan emails from the last 2 years' },
  { value: 'all', label: 'All emails', description: 'Scan all emails (may take a long time)' },
]

export function EmailScanDialog({
  accountId,
  email,
  provider,
  open,
  onOpenChange,
}: EmailScanDialogProps) {
  const [dateRange, setDateRange] = useState<DateRange>('6_months')
  const [scanType, setScanType] = useState<ScanType>('incremental')
  
  const startScan = useStartEmailScan(accountId)
  const { data: statusData, isLoading: isLoadingStatus } = useScanStatus(accountId, open)
  
  const scanStatus = getScanStatusDisplay(statusData?.scanJob || null)
  const isScanning = scanStatus.isRunning || startScan.isPending

  const handleStartScan = () => {
    startScan.mutate({ dateRange, scanType })
  }

  const getStatusIcon = () => {
    if (isScanning) return <Loader2 className="h-5 w-5 animate-spin" />
    if (scanStatus.label === 'Scan complete') return <CheckCircle className="h-5 w-5 text-green-500" />
    if (scanStatus.label === 'Scan failed') return <AlertCircle className="h-5 w-5 text-destructive" />
    return <Mail className="h-5 w-5" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scan Emails for Orders</DialogTitle>
          <DialogDescription>
            Scan {email} for order confirmation emails
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          {statusData?.scanJob && (
            <Card className="p-4">
              <div className="flex items-start gap-3">
                {getStatusIcon()}
                <div className="flex-1 space-y-2">
                  <p className="font-medium">{scanStatus.label}</p>
                  <p className="text-sm text-muted-foreground">{scanStatus.description}</p>
                  {scanStatus.isRunning && (
                    <Progress value={scanStatus.progress} className="h-2" />
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Configuration */}
          {!isScanning && (
            <>
              <div className="space-y-2">
                <Label htmlFor="date-range">Date Range</Label>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                  <SelectTrigger id="date-range">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scan-type">Scan Type</Label>
                <Select value={scanType} onValueChange={(value) => setScanType(value as ScanType)}>
                  <SelectTrigger id="scan-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incremental">
                      <div>
                        <div className="font-medium">Incremental</div>
                        <div className="text-xs text-muted-foreground">Only scan new emails</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="full">
                      <div>
                        <div className="font-medium">Full Scan</div>
                        <div className="text-xs text-muted-foreground">Re-scan all emails in range</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> The first scan may take a few minutes depending on the number of emails.
                  We'll process emails in batches to find order confirmations from supported retailers.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isScanning ? 'Close' : 'Cancel'}
          </Button>
          {!isScanning && (
            <Button onClick={handleStartScan} disabled={startScan.isPending}>
              {startScan.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Scan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}