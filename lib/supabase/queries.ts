import { supabase } from './client'
import type { 
  User, 
  UserInsert, 
  UserUpdate,
  Order, 
  OrderInsert, 
  OrderUpdate,
  OrderItem,
  OrderItemInsert
} from './types'

// User queries (client-safe, uses RLS)
export const userQueries = {

  async create(user: UserInsert): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(clerkId: string, updates: UserUpdate): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('clerk_id', clerkId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Order queries (client-safe, uses RLS)
export const orderQueries = {
  async getByUserId(userId: string, options?: {
    status?: string
    limit?: number
    offset?: number
  }): Promise<Order[]> {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('order_date', { ascending: false })
    
    if (options?.status) {
      query = query.eq('status', options.status)
    }
    
    if (options?.limit) {
      query = query.limit(options.limit)
    }
    
    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },


  async getById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (error) return null
    return data
  },

  async create(order: OrderInsert): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(orderId: string, updates: OrderUpdate): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(orderId: string): Promise<boolean> {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId)
    
    return !error
  },

  async getWithItems(orderId: string): Promise<(Order & { items: OrderItem[] }) | null> {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) return null
    
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (itemsError) return null
    
    return {
      ...order,
      items: items || []
    }
  }
}

// Order item queries (client-safe, uses RLS)
export const orderItemQueries = {
  async create(item: OrderItemInsert): Promise<OrderItem | null> {
    const { data, error } = await supabase
      .from('order_items')
      .insert(item)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async createMany(items: OrderItemInsert[]): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .insert(items)
      .select()
    
    if (error) throw error
    return data || []
  },

  async getByOrderId(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (error) throw error
    return data || []
  },

  async delete(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
    
    return !error
  }
}

