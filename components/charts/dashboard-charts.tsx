'use client'

import { Card, GlassCard } from '@/components/ui/card'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  AreaChart 
} from 'recharts'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { RetailerIcon } from '@/components/ui/retailer-icon'

// Premium color palette for charts
const CHART_COLORS = {
  primary: '#4F46E5',
  secondary: '#7C3AED',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  gradient: {
    primary: ['#4F46E5', '#7C3AED'],
    success: ['#10B981', '#059669'],
    warning: ['#F59E0B', '#D97706'],
    danger: ['#EF4444', '#DC2626'],
  }
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg border border-white/20">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface SpendingTrendChartProps {
  data: Array<{
    month: string
    spending: number
    orders: number
  }>
  className?: string
}

export function SpendingTrendChart({ data, className }: SpendingTrendChartProps) {
  return (
    <GlassCard className={cn("p-6", className)}>
      <h3 className="text-lg font-semibold mb-4 font-display">Spending Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="spending"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorSpending)"
              animationDuration={1500}
              animationBegin={0}
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke={CHART_COLORS.success}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOrders)"
              animationDuration={1500}
              animationBegin={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}

interface RetailerDistributionChartProps {
  data: Array<{
    name: string
    value: number
  }>
  className?: string
}

export function RetailerDistributionChart({ data, className }: RetailerDistributionChartProps) {
  const colors = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.danger,
    CHART_COLORS.info,
  ]

  return (
    <GlassCard className={cn("p-6", className)}>
      <h3 className="text-lg font-semibold mb-4 font-display">Retailer Distribution</h3>
      
      {/* Chart Section */}
      <div className="h-48 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ percent }) => `${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
              animationBegin={0}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Retailer Legend with Logos */}
      <div className="space-y-3">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <RetailerIcon retailer={entry.name} showName className="text-sm" />
            </div>
            <div className="text-right">
              <span className="text-sm font-medium">{entry.value}</span>
              <span className="text-xs text-muted-foreground ml-1">
                ({((entry.value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

interface OrderStatusChartProps {
  data: Array<{
    status: string
    count: number
  }>
  className?: string
}

export function OrderStatusChart({ data, className }: OrderStatusChartProps) {
  const statusColors: Record<string, string> = {
    pending: CHART_COLORS.warning,
    processing: CHART_COLORS.info,
    shipped: CHART_COLORS.secondary,
    delivered: CHART_COLORS.success,
    cancelled: CHART_COLORS.danger,
  }

  return (
    <GlassCard className={cn("p-6", className)}>
      <h3 className="text-lg font-semibold mb-4 font-display">Order Status Overview</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="status" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              radius={[8, 8, 0, 0]}
              animationDuration={1500}
              animationBegin={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={statusColors[entry.status.toLowerCase()] || CHART_COLORS.primary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}

interface MiniSparklineProps {
  data: number[]
  color?: string
  className?: string
}

export function MiniSparkline({ data, color = CHART_COLORS.primary, className }: MiniSparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }))
  
  return (
    <div className={cn("h-8 w-16", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Animated Chart Wrapper
export function AnimatedChart({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      {children}
    </motion.div>
  )
}