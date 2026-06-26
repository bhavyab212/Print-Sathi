import * as React from "react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

/** Glassmorphic surface — floating panels, navs, overlays. */
export function GlassCard({ className, children, ...props }: DivProps) {
  const { play } = useSound();
  return (
    <div
      className={cn(
        "glass glass-rim rounded-2xl transition-all duration-200 ease-spring hover:-translate-y-0.5",
        className
      )}
      onMouseEnter={() => play("hover")}
      {...props}
    >
      {children}
    </div>
  );
}

/** Strong glass — modals / command palettes that need more opacity. */
export function GlassPanel({ className, children, ...props }: DivProps) {
  return (
    <div
      className={cn(
        "glass-strong glass-rim rounded-3xl transition-all duration-200 ease-spring",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Neumorphic surface — controls, dashboard tiles, toggles. */
export function NeuCard({ className, children, ...props }: DivProps) {
  const { play } = useSound();
  return (
    <div
      className={cn(
        "neu transition-all duration-200 ease-spring",
        className
      )}
      onMouseEnter={() => play("hover")}
      {...props}
    >
      {children}
    </div>
  );
}

/** Claymorphic surface — illustrations, feature highlights, onboarding. */
export function ClayCard({ className, children, ...props }: DivProps) {
  const { play } = useSound();
  return (
    <div
      className={cn(
        "clay transition-all duration-200 ease-spring hover:-translate-y-0.5",
        className
      )}
      onMouseEnter={() => play("hover")}
      {...props}
    >
      {children}
    </div>
  );
}

/** Neutral elevated panel using the depth ladder (default elev-2). */
export function Panel({
  className,
  children,
  elevation = 2,
  ...props
}: DivProps & { elevation?: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--ps-hairline)] bg-[var(--ps-surface-1)] transition-all duration-200",
        `elev-${elevation}`,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
