import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-2xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/10 text-destructive dark:bg-destructive/20",
        outline: "border-border text-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground",
        amber: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold",
        emerald: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold",
        sky: "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold",
        purple: "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-semibold",
        rose: "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold",
        muted: "bg-slate-800 text-slate-300 border border-slate-700 font-normal",
        dark: "bg-slate-900 text-slate-200 border border-slate-800 font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
