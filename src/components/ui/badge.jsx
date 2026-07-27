import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary/10 text-primary",
        secondary:
          "bg-secondary text-secondary-foreground",
        destructive:
          "bg-red/10 text-red",
        outline: "text-foreground border border-border",
        success:
          "bg-green/10 text-green",
        warning:
          "bg-yellow/10 text-yellow",
        info:
          "bg-cyan/10 text-cyan",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
