// Email scanning related types

import type { EmailProvider } from '@/lib/supabase/types'

export type ScanStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ScanType = 'full' | 'incremental'

export type DateRange = '1_week' | '2_weeks' | '1_month' | '3_months' | '6_months'

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
  detected_language: string | null
  processed_at: string
  created_at: string
}

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  payload: {
    mimeType?: string
    headers: Array<{
      name: string
      value: string
    }>
    body?: {
      data?: string
      size?: number
    }
    parts?: Array<{
      mimeType: string
      filename?: string
      body?: {
        data?: string
        size?: number
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
  status?: 'confirmed' | 'shipped' | 'delivered'
  estimated_delivery?: string | null
  tracking_number?: string | null
  carrier?: string | null
  items?: Array<{
    name: string
    quantity: number
    price: number
  }>
  confidence: number // 0-1 score indicating parsing confidence
  language?: string // ISO 639-1 language code (nl, de, fr, en)
}

export interface EmailParser {
  canParse(email: GmailMessage): boolean
  parse(email: GmailMessage): Promise<ParsedOrder | null>
  getRetailerName(): string
  getRetailerDomains(): string[]
}

// Date range configurations in milliseconds
export const DATE_RANGE_MS: Record<DateRange, number> = {
  '1_week': 7 * 24 * 60 * 60 * 1000,
  '2_weeks': 14 * 24 * 60 * 60 * 1000,
  '1_month': 30 * 24 * 60 * 60 * 1000,
  '3_months': 90 * 24 * 60 * 60 * 1000,
  '6_months': 180 * 24 * 60 * 60 * 1000
}

export function getDateFromRange(range: DateRange): Date {
  const ms = DATE_RANGE_MS[range]
  return new Date(Date.now() - ms)
}

export function getDateRange(range: DateRange): { startDate: Date; endDate: Date } {
  const startDate = getDateFromRange(range)
  const endDate = new Date()
  return { startDate, endDate }
}