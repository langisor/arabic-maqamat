import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border",
        amber:
          "border-amber-500/30 bg-amber-500/15 text-amber-300 shadow-sm",
        emerald:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-sm",
        sky:
          "border-sky-500/30 bg-sky-500/15 text-sky-300 shadow-sm",
        purple:
          "border-purple-500/30 bg-purple-500/15 text-purple-300 shadow-sm",
        rose:
          "border-rose-500/30 bg-rose-500/15 text-rose-300 shadow-sm",
        muted:
          "border-slate-800 bg-slate-900/80 text-slate-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
