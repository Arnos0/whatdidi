import 'server-only'
import { createServerClient } from './server-client'
import type { 
  User, 
  UserInsert, 
  Order,
  OrderInsert,
  OrderItem,
  OrderItemInsert
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
        console.error('Supabase upsert error:', error)
        throw new Error(`Database error: ${error.message}`)
      }
      
      if (!data) {
        throw new Error('No data returned from upsert')
      }
      
      return data
    } catch (error) {
      console.error('syncFromClerk error:', error)
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

  async create(order: OrderInsert): Promise<Order | null> {
    const serverClient = createServerClient()
    const { data, error } = await serverClient
      .from('orders')
      .insert(order)
      .select()
      .single()
    
    if (error) throw error
    return data
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