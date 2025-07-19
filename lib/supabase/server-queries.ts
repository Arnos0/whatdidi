import 'server-only'
import { createServerClient } from './server-client'
import type { 
  User, 
  UserInsert, 
  Order,
  OrderInsert,
  OrderItem,
  OrderItemInsert,
  EmailAccount,
  EmailAccountInsert,
  EmailAccountUpdate
} from './types'

// These queries are for server-side use only and use the service role key
// They bypass RLS for administrative operations

export const serverUserQueries = {
  async findByClerkId(clerkId: string): Promise<User | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single()
    
    if (error) {
      return null
    }
    return data
  },

  async syncFromClerk(clerkUser: {
    id: string
    emailAddresses: Array<{ emailAddress: string }>
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
  }): Promise<User> {
    try {
      const serverClient = createServerClient()
      
      if (!clerkUser.emailAddresses || clerkUser.emailAddresses.length === 0) {
        throw new Error('User has no email addresses')
      }
      
      const userData: UserInsert = {
        clerk_id: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
        name: clerkUser.firstName && clerkUser.lastName 
          ? `${clerkUser.firstName} ${clerkUser.lastName}` 
          : clerkUser.firstName || clerkUser.lastName || null,
        avatar_url: clerkUser.imageUrl || null
      }
      
      const { data, error } = await serverClient
        .from('users')
        .upsert(userData, { 
          onConflict: 'clerk_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()
      
      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }
      
      if (!data) {
        throw new Error('No data returned from upsert')
      }
      
      return data
    } catch (error) {
      throw error
    }
  }
}

export const serverOrderQueries = {
  async getByUserIdWithFilters(userId: string, options: {
    status?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    limit: number
    offset: number
  }): Promise<{ orders: Order[], total: number }> {
    const serverClient = createServerClient()
    
    // Build the query with all filters
    let query = serverClient
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
    
    if (options.status) {
      query = query.eq('status', options.status)
    }
    
    if (options.search) {
      // Properly escape the search term to prevent injection
      const escapedSearch = options.search.replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.or(`order_number.ilike.%${escapedSearch}%,retailer.ilike.%${escapedSearch}%`)
    }
    
    if (options.dateFrom) {
      query = query.gte('order_date', options.dateFrom)
    }
    
    if (options.dateTo) {
      query = query.lte('order_date', options.dateTo)
    }
    
    // Apply ordering, pagination
    query = query
      .order('order_date', { ascending: false })
      .range(options.offset, options.offset + options.limit - 1)
    
    const { data, error, count } = await query
    
    if (error) throw error
    return {
      orders: data || [],
      total: count || 0
    }
  },

  async getByIdWithItems(orderId: string, userId: string): Promise<(Order & { order_items: OrderItem[] }) | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('orders')
      .select(`
        *,
        order_items!order_items_order_id_fkey (*)
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }
    return data
  },

  async updateById(orderId: string, userId: string, updates: Partial<OrderInsert>): Promise<Order | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }
    return data
  },

  async create(order: OrderInsert): Promise<Order | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('orders')
      .insert(order)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByIdAndUserId(orderId: string, userId: string): Promise<Order | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }
    return data
  },

  async getAllForSitemap(limit: number = 1000): Promise<{ id: string; updated_at: string | null; created_at: string }[]> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('orders')
      .select('id, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  }
}

export const serverOrderItemQueries = {
  async createMany(items: OrderItemInsert[]): Promise<OrderItem[]> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('order_items')
      .insert(items)
      .select()
    
    if (error) throw error
    return data || []
  }
}

export const serverEmailAccountQueries = {
  async create(account: EmailAccountInsert): Promise<EmailAccount | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('email_accounts')
      .insert(account)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByUserId(userId: string): Promise<EmailAccount[]> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string, userId: string): Promise<EmailAccount | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('email_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }
    return data
  },

  async updateTokens(
    id: string, 
    userId: string, 
    tokens: { 
      access_token: string, 
      refresh_token?: string, 
      token_expires_at?: string 
    }
  ): Promise<EmailAccount | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('email_accounts')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokens.token_expires_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }
    return data
  },

  async updateLastScan(id: string, userId: string): Promise<EmailAccount | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('email_accounts')
      .update({
        last_scan_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }
    return data
  },

  async delete(id: string, userId: string): Promise<boolean> {
    const serverClient = createServerClient()
    const { error } = await serverClient
      .from('email_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
    return true
  },

  async findByUserEmail(userId: string, email: string): Promise<EmailAccount | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('email', email)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw error
    }
    return data
  }
}