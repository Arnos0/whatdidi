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
          created_at: string
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
          created_at?: string
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