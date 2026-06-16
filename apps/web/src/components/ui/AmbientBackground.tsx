import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Ambient mesh + floating gradient orbs + optional grain.
 * Drop as the first child of a `relative` container; sits at z-0 behind content.
 * Pure CSS animation (orbFloat) — GPU-friendly, reduced-motion aware via globals.css.
 */
export function AmbientBackground({
  className,
  orbs = true,
  grain = true,
}: {
  className?: string;
  orbs?: boolean;
  grain?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden mesh-bg",
        grain && "grain",
        className
      )}
    >
      {orbs && (
        <div className="ambient-orbs absolute inset-0">
          <span
            className="orb"
            style={{
              width: 420,
              height: 420,
              left: "-8%",
              top: "-12%",
              background: "var(--mesh-1)",
            }}
          />
          <span
            className="orb"
            style={{
              width: 360,
              height: 360,
              right: "-6%",
              top: "8%",
              background: "var(--mesh-2)",
              animationDelay: "-6s",
            }}
          />
          <span
            className="orb"
            style={{
              width: 300,
              height: 300,
              left: "40%",
              bottom: "-10%",
              background: "var(--mesh-3)",
              animationDelay: "-11s",
            }}
          />
        </div>
      )}
    </div>
  );
}
