import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground dark:bg-transparent dark:hover:bg-slate-800/60",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted hover:text-foreground dark:hover:bg-slate-800/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
        amber: "bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-md shadow-amber-500/20 active:scale-95 transition",
        amberOutline: "border border-amber-500/50 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 active:scale-95 transition",
        emerald: "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-600/20 active:scale-95 transition",
        emeraldOutline: "border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 active:scale-95 transition",
        sky: "bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md shadow-sky-600/20 active:scale-95 transition",
        skyOutline: "border border-sky-500/50 text-sky-300 hover:bg-sky-500/10 active:scale-95 transition",
        purple: "bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-md shadow-purple-600/20 active:scale-95 transition",
        rose: "bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md shadow-rose-600/20 active:scale-95 transition",
        dark: "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 active:scale-95 transition",
        muted: "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-95 transition",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs: "h-6 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 text-xs",
        lg: "h-9 gap-1.5 px-4",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
