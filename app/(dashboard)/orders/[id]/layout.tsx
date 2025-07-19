import { createMetadata } from '@/lib/utils/metadata'
import { serverOrderQueries } from '@/lib/supabase/server-queries'
import { auth } from '@clerk/nextjs/server'
import { serverUserQueries } from '@/lib/supabase/server-queries'

interface OrderLayoutProps {
  children: React.ReactNode
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    // Get authenticated user
    const { userId: clerkId } = await auth()
    if (!clerkId) {
      return createMetadata({
        title: 'Order Details - WhatDidiShop',
        description: 'View order details and tracking information.',
        path: `/orders/${params.id}`,
        noIndex: true,
      })
    }

    // Get user from database
    const user = await serverUserQueries.findByClerkId(clerkId)
    if (!user) {
      return createMetadata({
        title: 'Order Details - WhatDidiShop',
        description: 'View order details and tracking information.',
        path: `/orders/${params.id}`,
        noIndex: true,
      })
    }

    // Get order details
    const order = await serverOrderQueries.getByIdAndUserId(params.id, user.id)
    
    if (order) {
      return createMetadata({
        title: `Order #${order.order_number} from ${order.retailer} - WhatDidiShop`,
        description: `Track your order #${order.order_number} from ${order.retailer}. View order details, delivery status, and more.`,
        path: `/orders/${params.id}`,
        noIndex: true, // Private user data - never index individual orders
      })
    }

    // Fallback if order not found
    return createMetadata({
      title: 'Order Not Found - WhatDidiShop',
      description: 'The requested order could not be found.',
      path: `/orders/${params.id}`,
      noIndex: true,
    })
  } catch (error) {
    // Fallback on error
    return createMetadata({
      title: 'Order Details - WhatDidiShop',
      description: 'View order details and tracking information.',
      path: `/orders/${params.id}`,
      noIndex: true, // Private user data - always noindex on error
    })
  }
}

export default function OrderLayout({ children }: OrderLayoutProps) {
  return children
}