"use client";
import { Boxicon } from "@/components/ui";


import * as React from "react";
import { motion } from "motion/react";
import { AmbientBackground, GlassPanel } from "@/components/ui";
import { fadeUp, scaleIn, spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Full-screen auth/onboarding scaffold: ambient background + centered glass card.
 * Presentation only — children own all logic.
 */
export function AuthShell({
  children,
  maxWidth = "md",
}: {
  children: React.ReactNode;
  maxWidth?: "md" | "lg";
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <AmbientBackground />
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className={cn("w-full", maxWidth === "lg" ? "max-w-lg" : "max-w-md")}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Brand lockup: clay-accent logo tile + wordmark. */
export function AuthBrand({
  icon = "bx-printer",
  title = "Print Sathi",
  subtitle = "Smart Print Shop Manager",
}: {
  icon?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        className="animate-float mx-auto mb-4 flex h-16 w-16 items-center justify-center"
      >
        <img src="/images/logo.png" alt="Print Sathi Logo" className="w-full h-full object-contain drop-shadow-md" />
      </motion.div>
      <h1 className="text-h2 text-gradient font-display">{title}</h1>
      <p className="text-caption mt-1 text-[var(--ps-ink-muted)]">{subtitle}</p>
    </div>
  );
}

/** The frosted auth card. */
export function AuthCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <GlassPanel className={cn("p-8 shadow-elev-4", className)}>{children}</GlassPanel>
  );
}

/** Premium neu-inset input field with focus glow ring. */
export const AuthInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ label, id, className, ...props }, ref) => {
  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="text-caption mb-1.5 block font-medium text-[var(--ps-ink)]"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          "neu-inset w-full rounded-xl border-0 bg-transparent px-4 py-3 text-sm text-[var(--ps-ink)] placeholder:text-[var(--ps-ink-subtle)] outline-none transition-all duration-200",
          "focus:shadow-glow-primary focus:ring-1 focus:ring-[var(--ps-primary)]/40",
          className
        )}
        {...props}
      />
    </div>
  );
});
AuthInput.displayName = "AuthInput";

/** Glass error/alert chip. */
export function AuthAlert({
  children,
  tone = "danger",
}: {
  children: React.ReactNode;
  tone?: "danger" | "success";
}) {
  const isDanger = tone === "danger";
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={cn(
        "glass flex items-start gap-2 rounded-xl p-3 text-sm",
        isDanger
          ? "text-[var(--ps-danger)] ring-1 ring-[var(--ps-danger)]/30"
          : "text-[var(--ps-success)] ring-1 ring-[var(--ps-success)]/30"
      )}
    >
      <Boxicon className={cn(
          "bx mt-0.5 shrink-0",
          isDanger ? "bx-error-circle" : "bx-check-circle"
        )} />
      <span>{children}</span>
    </motion.div>
  );
}

/** Footer copyright line. */
export function AuthFooter() {
  return (
    <p className="text-caption mt-6 text-center text-[var(--ps-ink-subtle)]">
      Print Sathi © {new Date().getFullYear()}
    </p>
  );
}
