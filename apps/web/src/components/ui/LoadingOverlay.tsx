"use client";

import Lottie from "lottie-react";
import loadingAnimation from "../../../public/animations/loading.json";
import { cn } from "@/lib/utils";

export const MIN_LOADING_MS = 900;

export function LoadingOverlay({
  className,
  fullScreen = true,
}: {
  className?: string;
  fullScreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-[var(--ps-canvas)] text-[var(--ps-ink)]",
        fullScreen ? "fixed inset-0 z-[9999]" : "min-h-[360px] w-full",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="h-64 w-64 sm:h-80 sm:w-80">
        <Lottie animationData={loadingAnimation} loop autoplay />
      </div>
    </div>
  );
}
