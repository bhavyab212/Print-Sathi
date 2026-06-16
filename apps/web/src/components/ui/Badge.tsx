import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      tone: {
        neutral: "bg-[var(--ps-surface-3)] text-[var(--ps-ink-muted)]",
        pending: "bg-[var(--ps-warning-muted)] text-[var(--ps-warning)]",
        approved: "bg-[var(--ps-info-muted)] text-[var(--ps-info)]",
        printing: "bg-[rgba(92,107,200,0.15)] text-[var(--ps-primary)]",
        done: "bg-[var(--ps-success-muted)] text-[var(--ps-success)]",
        rejected: "bg-[var(--ps-danger-muted)] text-[var(--ps-danger)]",
        glass: "glass text-[var(--ps-ink)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
