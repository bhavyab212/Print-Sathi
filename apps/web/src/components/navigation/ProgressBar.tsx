"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  isAnimating: boolean;
  onComplete?: () => void;
}

export function ProgressBar({ isAnimating, onComplete }: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      setVisible(true);
      setWidth(0);
      const t1 = setTimeout(() => setWidth(30), 50);
      const t2 = setTimeout(() => setWidth(60), 300);
      const t3 = setTimeout(() => setWidth(85), 600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setWidth(100);
      const t = setTimeout(() => {
        setVisible(false);
        setWidth(0);
        onComplete?.();
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isAnimating, onComplete]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[10000] h-[3px] transition-opacity duration-300",
        width === 100 ? "opacity-100" : "opacity-100"
      )}
      style={{ pointerEvents: "none" }}
    >
      <div
        className="h-full rounded-r-full transition-all duration-[400ms] ease-out"
        style={{
          width: `${width}%`,
          background: "linear-gradient(90deg, var(--ps-primary), #818cf8, var(--ps-accent-sky))",
          boxShadow: "0 0 8px var(--ps-primary), 0 0 16px var(--glow-primary)",
        }}
      />
    </div>
  );
}
