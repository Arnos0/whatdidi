export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      email_accounts: {
        Row: {
          id: string
          user_id: string
          provider: string
          email: string
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          last_scan_at: string | null
          scan_enabled: boolean
          scan_config: Json
          last_full_scan_at: string | null
          total_emails_processed: number
          total_orders_created: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          email: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_scan_at?: string | null
          scan_enabled?: boolean
          scan_config?: Json
          last_full_scan_at?: string | null
          total_emails_processed?: number
          total_orders_created?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          email?: string
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_scan_at?: string | null
          scan_enabled?: boolean
          scan_config?: Json
          last_full_scan_at?: string | null
          total_emails_processed?: number
          total_orders_created?: number
          created_at?: string
          updated_at?: string
        }
      }
      email_scan_jobs: {
        Row: {
          id: string
          email_account_id: string
          status: string
          scan_type: string
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
        Insert: {
          id?: string
          email_account_id: string
          status?: string
          scan_type?: string
          date_from?: string | null
          date_to?: string | null
          started_at?: string | null
          completed_at?: string | null
          emails_found?: number
          emails_processed?: number
          orders_created?: number
          errors_count?: number
          last_error?: string | null
          next_page_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email_account_id?: string
          status?: string
          scan_type?: string
          date_from?: string | null
          date_to?: string | null
          started_at?: string | null
          completed_at?: string | null
          emails_found?: number
          emails_processed?: number
          orders_created?: number
          errors_count?: number
          last_error?: string | null
          next_page_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      processed_emails: {
        Row: {
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
        Insert: {
          id?: string
          email_account_id: string
          gmail_message_id: string
          gmail_thread_id?: string | null
          email_date?: string | null
          subject?: string | null
          sender?: string | null
          retailer_detected?: string | null
          order_created?: boolean
          order_id?: string | null
          parse_error?: string | null
          processed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          email_account_id?: string
          gmail_message_id?: string
          gmail_thread_id?: string | null
          email_date?: string | null
          subject?: string | null
          sender?: string | null
          retailer_detected?: string | null
          order_created?: boolean
          order_id?: string | null
          parse_error?: string | null
          processed_at?: string
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          order_number: string
          retailer: string
          amount: number
          currency: string
          status: string
          tracking_number: string | null
          carrier: string | null
          order_date: string
          estimated_delivery: string | null
          email_account_id: string | null
          raw_email_data: Json | null
          is_manual: boolean
          receipt_url: string | null
          needs_review: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_number: string
          retailer: string
          amount: number
          currency?: string
          status?: string
          tracking_number?: string | null
          carrier?: string | null
          order_date: string
          estimated_delivery?: string | null
          email_account_id?: string | null
          raw_email_data?: Json | null
          is_manual?: boolean
          receipt_url?: string | null
          needs_review?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_number?: string
          retailer?: string
          amount?: number
          currency?: string
          status?: string
          tracking_number?: string | null
          carrier?: string | null
          order_date?: string
          estimated_delivery?: string | null
          email_account_id?: string | null
          raw_email_data?: Json | null
          is_manual?: boolean
          receipt_url?: string | null
          needs_review?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          description: string
          quantity: number
          price: number | null
          image_url: string | null
          product_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          description: string
          quantity?: number
          price?: number | null
          image_url?: string | null
          product_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          description?: string
          quantity?: number
          price?: number | null
          image_url?: string | null
          product_url?: string | null
          created_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          order_id: string
          carrier: string
          tracking_number: string
          status: string
          last_update: string | null
          estimated_delivery: string | null
          delivery_address: Json | null
          tracking_events: Json[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          carrier: string
          tracking_number: string
          status: string
          last_update?: string | null
          estimated_delivery?: string | null
          delivery_address?: Json | null
          tracking_events?: Json[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          carrier?: string
          tracking_number?: string
          status?: string
          last_update?: string | null
          estimated_delivery?: string | null
          delivery_address?: Json | null
          tracking_events?: Json[] | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Order = Database['public']['Tables']['orders']['Row']
export type OrderInsert = Database['public']['Tables']['orders']['Insert']
export type OrderUpdate = Database['public']['Tables']['orders']['Update']

export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert']
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update']

export type EmailAccount = Database['public']['Tables']['email_accounts']['Row']
export type EmailAccountInsert = Database['public']['Tables']['email_accounts']['Insert']
export type EmailAccountUpdate = Database['public']['Tables']['email_accounts']['Update']

export type Delivery = Database['public']['Tables']['deliveries']['Row']
export type DeliveryInsert = Database['public']['Tables']['deliveries']['Insert']
export type DeliveryUpdate = Database['public']['Tables']['deliveries']['Update']

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type DeliveryStatus = 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed'
export type EmailProvider = 'gmail' | 'outlook'
export type Carrier = 'postnl' | 'dhl' | 'dpd'