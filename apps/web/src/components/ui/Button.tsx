"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useInteractionSound } from "@/hooks/useSound";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-semibold select-none transition-all duration-200 ease-spring active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ps-canvas)] disabled:opacity-40 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "text-white bg-[var(--ps-primary)] hover:bg-[var(--ps-primary-hover)] hover:shadow-[var(--glow-primary)] hover:-translate-y-0.5",
        glass:
          "glass glass-rim text-[var(--ps-ink)] hover:shadow-[var(--elev-3)] hover:-translate-y-0.5",
        neu:
          "neu text-[var(--ps-ink)] active:[box-shadow:inset_2px_2px_6px_var(--neu-dark),inset_-2px_-2px_6px_var(--neu-light)]",
        ghost:
          "text-[var(--ps-ink-muted)] hover:text-[var(--ps-ink)] hover:bg-[var(--ps-surface-2)]",
        danger:
          "text-white bg-[var(--ps-danger)] hover:shadow-[var(--glow-danger)] hover:-translate-y-0.5",
        success:
          "text-white bg-[var(--ps-success)] hover:shadow-[var(--glow-success)] hover:-translate-y-0.5",
        outline:
          "border border-[var(--ps-hairline-strong)] text-[var(--ps-ink)] hover:bg-[var(--ps-surface-2)] hover:border-[var(--ps-primary)]",
      },
      size: {
        sm: "h-9 px-3.5 text-xs rounded-xl",
        md: "h-11 px-5 text-sm rounded-xl",
        lg: "h-13 px-7 text-base rounded-2xl py-3.5",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  sound?: "click" | "success" | "error" | "toggle-on" | "toggle-off" | null;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, sound = "click", onClick, ...props }, ref) => {
    const { onClick: playClick, onHover, onSuccess, onError, onToggle } = useInteractionSound();

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (sound === "click") playClick();
        else if (sound === "success") onSuccess();
        else if (sound === "error") onError();
        else if (sound === "toggle-on") onToggle(true);
        else if (sound === "toggle-off") onToggle(false);
        onClick?.(e);
      },
      [sound, playClick, onSuccess, onError, onToggle, onClick]
    );

    return (
      <button
        ref={ref}
        className={cn(button({ variant, size }), className)}
        onMouseEnter={onHover}
        onClick={handleClick}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { button as buttonVariants };
