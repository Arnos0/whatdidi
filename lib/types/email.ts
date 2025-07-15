// Email scanning related types

import type { EmailProvider } from '@/lib/supabase/types'

export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ScanType = 'full' | 'incremental'

export type DateRange = '1_month' | '3_months' | '6_months' | '1_year' | '2_years' | 'all'

export interface ScanConfig {
  date_range: DateRange
  auto_scan: boolean
  scan_interval_hours: number
}

export interface EmailScanJob {
  id: string
  email_account_id: string
  status: ScanStatus
  scan_type: ScanType
  date_from: string | null
  date_to: string | null
  started_at: string | null
  completed_at: string | null
  emails_found: number
  emails_processed: number
  orders_created: number
  errors_count: number
  last_error: string | null
  next_page_token: string | null
  created_at: string
  updated_at: string
}

export interface ProcessedEmail {
  id: string
  email_account_id: string
  gmail_message_id: string
  gmail_thread_id: string | null
  email_date: string | null
  subject: string | null
  sender: string | null
  retailer_detected: string | null
  order_created: boolean
  order_id: string | null
  parse_error: string | null
  processed_at: string
  created_at: string
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
    body?: {
      data?: string
    }
    parts?: Array<{
      mimeType: string
      body?: {
        data?: string
      }
    }>
  }
  internalDate: string
}

export interface ParsedOrder {
  order_number: string
  retailer: string
  amount: number
  currency: string
  order_date: string
  estimated_delivery?: string | null
  tracking_number?: string | null
  carrier?: string | null
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  confidence: number // 0-1 score indicating parsing confidence
}

export interface EmailParser {
  canParse(email: GmailMessage): boolean
  parse(email: GmailMessage): Promise<ParsedOrder | null>
  getRetailerName(): string
  getRetailerDomains(): string[]
}

// Date range configurations in milliseconds
export const DATE_RANGE_MS: Record<DateRange, number | null> = {
  '1_month': 30 * 24 * 60 * 60 * 1000,
  '3_months': 90 * 24 * 60 * 60 * 1000,
  '6_months': 180 * 24 * 60 * 60 * 1000,
  '1_year': 365 * 24 * 60 * 60 * 1000,
  '2_years': 730 * 24 * 60 * 60 * 1000,
  'all': null
}

export function getDateFromRange(range: DateRange): Date | null {
  const ms = DATE_RANGE_MS[range]
  if (ms === null) return null
  return new Date(Date.now() - ms)
}