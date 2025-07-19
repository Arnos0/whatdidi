'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:scale-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg hover:scale-105",
        outline:
          "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent hover:shadow-md hover:scale-105",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:scale-105",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline",
        gradient:
          "bg-gradient-primary text-white shadow-md hover:shadow-glow hover:scale-105 border border-transparent",
        "gradient-success":
          "bg-gradient-success text-white shadow-md hover:shadow-success-500/25 hover:scale-105 border border-transparent",
        "gradient-warning":
          "bg-gradient-warning text-white shadow-md hover:shadow-warning-500/25 hover:scale-105 border border-transparent",
        "gradient-danger":
          "bg-gradient-danger text-white shadow-md hover:shadow-red-500/25 hover:scale-105 border border-transparent",
        premium:
          "bg-gradient-premium text-white shadow-lg hover:shadow-glow-lg hover:scale-105 border border-transparent",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface RippleProps {
  x: number
  y: number
}

const Ripple: React.FC<RippleProps> = ({ x, y }) => (
  <motion.span
    className="absolute rounded-full bg-white/30"
    style={{ left: x, top: y }}
    initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
    animate={{ width: 300, height: 300, x: -150, y: -150, opacity: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  />
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, icon, iconPosition = "left", children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<RippleProps[]>([])
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const combinedRef = ref || buttonRef

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!asChild && variant !== "link") {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        setRipples((prev) => [...prev, { x, y }])
        setTimeout(() => {
          setRipples((prev) => prev.slice(1))
        }, 600)
      }
      
      onClick?.(e)
    }

    const Comp = asChild ? Slot : motion.button
    
    const buttonContent = (
      <>
        {loading ? (
          <motion.svg
            className="h-4 w-4 animate-spin"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </motion.svg>
        ) : (
          <>
            {icon && iconPosition === "left" && <span className="mr-2">{icon}</span>}
            {children}
            {icon && iconPosition === "right" && <span className="ml-2">{icon}</span>}
          </>
        )}
      </>
    )
    
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={combinedRef as any}
          {...props}
        >
          {buttonContent}
        </Slot>
      )
    }
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "overflow-hidden")}
        ref={combinedRef as any}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...props}
      >
        {variant !== "link" && (
          <AnimatePresence>
            {ripples.map((ripple, index) => (
              <Ripple key={index} x={ripple.x} y={ripple.y} />
            ))}
          </AnimatePresence>
        )}
        {buttonContent}
        {(variant === "gradient" || variant === "gradient-success" || variant === "gradient-warning" || 
          variant === "gradient-danger" || variant === "premium") && (
          <motion.div
            className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)",
            }}
          />
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
