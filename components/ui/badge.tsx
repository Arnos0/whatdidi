'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 hover:shadow-md",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: 
          "text-foreground border hover:bg-accent hover:text-accent-foreground",
        gradient:
          "border-transparent bg-gradient-primary text-white shadow-md hover:shadow-glow hover:scale-105",
        "gradient-success":
          "border-transparent bg-gradient-success text-white shadow-md hover:shadow-success-500/25 hover:scale-105",
        "gradient-warning":
          "border-transparent bg-gradient-warning text-white shadow-md hover:shadow-warning-500/25 hover:scale-105",
        "gradient-danger":
          "border-transparent bg-gradient-danger text-white shadow-md hover:shadow-red-500/25 hover:scale-105",
        glass:
          "glass-card border-white/20 text-foreground backdrop-blur-sm hover:bg-white/10",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
      animate: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        glow: "animate-pulse-glow",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animate: "none",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  motion?: boolean
}

function Badge({ className, variant, size, animate, icon, iconPosition = "left", motion: enableMotion = false, children, ...props }: BadgeProps) {
  const Comp = enableMotion ? motion.div : 'div'
  
  const animationProps = enableMotion ? {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  } : {}

  return (
    <Comp
      className={cn(badgeVariants({ variant, size, animate }), className)}
      {...animationProps}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="mr-1 flex items-center">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="ml-1 flex items-center">{icon}</span>
      )}
    </Comp>
  )
}

export { Badge, badgeVariants }
