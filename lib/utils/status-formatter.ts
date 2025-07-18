/**
 * Status formatting utilities for Dutch and English labels
 */

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface StatusConfig {
  label: string
  labelNL: string
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red'
  icon: string
}

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'Pending',
    labelNL: 'In behandeling',
    color: 'gray',
    icon: '⏳'
  },
  processing: {
    label: 'Processing',
    labelNL: 'Wordt verwerkt',
    color: 'blue',
    icon: '⚙️'
  },
  shipped: {
    label: 'Shipped',
    labelNL: 'Verzonden',
    color: 'yellow',
    icon: '📦'
  },
  delivered: {
    label: 'Delivered',
    labelNL: 'Geleverd',
    color: 'green',
    icon: '✅'
  },
  cancelled: {
    label: 'Cancelled',
    labelNL: 'Geannuleerd',
    color: 'red',
    icon: '❌'
  }
}

export function getStatusConfig(status: OrderStatus): StatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending
}

export function getStatusLabel(status: OrderStatus, language: 'en' | 'nl' = 'en'): string {
  const config = getStatusConfig(status)
  return language === 'nl' ? config.labelNL : config.label
}

export function getStatusColor(status: OrderStatus): string {
  const config = getStatusConfig(status)
  
  const colorMap = {
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  }
  
  return colorMap[config.color]
}

export function getStatusIcon(status: OrderStatus): string {
  return getStatusConfig(status).icon
}

/**
 * Get all available statuses for dropdowns/filters
 */
export function getAllStatuses(language: 'en' | 'nl' = 'en') {
  return Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value: value as OrderStatus,
    label: language === 'nl' ? config.labelNL : config.label,
    icon: config.icon
  }))
}