'use client'

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "relative rounded-xl text-card-foreground transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border bg-card shadow-soft hover:shadow-md",
        glass: [
          "glass-card",
          "hover:shadow-glass hover:-translate-y-1",
          "transition-all duration-300"
        ].join(" "),
        gradient: [
          "bg-gradient-to-br from-white/80 to-white/40",
          "backdrop-blur-md border border-white/20",
          "shadow-lg hover:shadow-xl hover:-translate-y-1",
          "dark:from-gray-900/80 dark:to-gray-900/40",
          "dark:border-white/10"
        ].join(" "),
        elevated: [
          "bg-card shadow-lg hover:shadow-xl",
          "hover:-translate-y-2 transform",
          "border-0"
        ].join(" "),
        interactive: [
          "bg-card border cursor-pointer",
          "hover:border-primary/50 hover:shadow-glow",
          "hover:bg-accent/5 active:scale-[0.98]",
          "transition-all duration-200"
        ].join(" "),
      },
      glow: {
        none: "",
        primary: "shadow-glow",
        success: "shadow-success-500/20",
        warning: "shadow-warning-500/20",
        danger: "shadow-red-500/20",
      }
    },
    defaultVariants: {
      variant: "default",
      glow: "none",
    },
  }
)

interface CardProps
  extends Omit<HTMLMotionProps<"div">, keyof VariantProps<typeof cardVariants>>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, glow, hover = true, ...props }, ref) => {
    const cardProps = hover ? {
      whileHover: { scale: 1.02, transition: { duration: 0.2 } },
      whileTap: { scale: 0.98 },
    } : {}

    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, glow, className }))}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...cardProps}
        {...props}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, onClick }, ref) => (
  <motion.h3
    ref={ref}
    className={cn("font-display font-semibold text-xl leading-none tracking-tight", className)}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: 0.1 }}
    style={style}
    onClick={onClick}
  >
    {children}
  </motion.h3>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, onClick }, ref) => (
  <motion.p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3, delay: 0.2 }}
    style={style}
    onClick={onClick}
  >
    {children}
  </motion.p>
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Premium Card Components
export const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, style, onClick }, ref) => (
  <Card
    ref={ref}
    variant="glass"
    className={cn("overflow-hidden", className)}
    style={style}
    onClick={onClick}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
    <div className="relative z-10">{children}</div>
  </Card>
))
GlassCard.displayName = "GlassCard"

export const MetricCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Card> & {
    icon?: React.ReactNode
    title: string
    value: string | number
    subtitle?: string
    trend?: {
      value: number
      isPositive: boolean
    }
  }
>(({ className, icon, title, value, subtitle, trend, ...props }, ref) => (
  <Card
    ref={ref}
    variant="gradient"
    className={cn("group", className)}
    hover
    {...props}
  >
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <motion.p 
            className="text-sm font-medium text-muted-foreground"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {title}
          </motion.p>
          <motion.div 
            className="text-3xl font-bold font-display"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            {value}
          </motion.div>
          {subtitle && (
            <motion.p 
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {subtitle}
            </motion.p>
          )}
          {trend && (
            <motion.div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trend.isPositive ? "text-success-600" : "text-destructive"
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <motion.span
                animate={{ y: trend.isPositive ? -2 : 2 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              >
                {trend.isPositive ? "↑" : "↓"}
              </motion.span>
              {Math.abs(trend.value)}%
            </motion.div>
          )}
        </div>
        {icon && (
          <motion.div
            className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        )}
      </div>
    </CardContent>
  </Card>
))
MetricCard.displayName = "MetricCard"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
