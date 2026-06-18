"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

/**
 * Animated mesh gradient background styled after shadcn.io/background/gradient.
 * Floating color blobs in teal, purple, blue, and pink that drift and blend together.
 * Uses GPU-accelerated framer-motion keyframes.
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
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-[#030014]/50 mesh-bg",
        grain && "grain",
        className
      )}
    >
      {orbs && mounted && (
        <div className="absolute inset-0 filter blur-[80px] md:blur-[120px] opacity-70 mix-blend-screen pointer-events-none">
          {/* Teal Blob */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "40vw",
              height: "40vw",
              minWidth: "320px",
              minHeight: "320px",
              left: "5%",
              top: "-5%",
              background: "radial-gradient(circle, rgba(0,204,177,0.3) 0%, rgba(0,204,177,0) 70%)",
            }}
            animate={{
              x: [0, 80, -60, 40, 0],
              y: [0, -40, 60, -50, 0],
              scale: [1, 1.1, 0.9, 1.05, 1],
            }}
            transition={{
              duration: 22,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Purple Blob */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "35vw",
              height: "35vw",
              minWidth: "280px",
              minHeight: "280px",
              right: "10%",
              top: "10%",
              background: "radial-gradient(circle, rgba(123,97,255,0.25) 0%, rgba(123,97,255,0) 70%)",
            }}
            animate={{
              x: [0, -60, 90, -40, 0],
              y: [0, 60, -50, 70, 0],
              scale: [1, 0.95, 1.05, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Blue Blob */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "38vw",
              height: "38vw",
              minWidth: "300px",
              minHeight: "300px",
              left: "15%",
              bottom: "10%",
              background: "radial-gradient(circle, rgba(28,160,251,0.25) 0%, rgba(28,160,251,0) 70%)",
            }}
            animate={{
              x: [0, 70, -80, 50, 0],
              y: [0, 50, 60, -70, 0],
              scale: [1, 1.05, 1.1, 0.95, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Pink Blob */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "35vw",
              height: "35vw",
              minWidth: "280px",
              minHeight: "280px",
              right: "15%",
              bottom: "5%",
              background: "radial-gradient(circle, rgba(255,73,219,0.2) 0%, rgba(255,73,219,0) 70%)",
            }}
            animate={{
              x: [0, -70, 60, -60, 0],
              y: [0, -65, 70, 40, 0],
              scale: [1, 1.1, 0.9, 1.05, 1],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Secondary Purple/Violet Blob */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: "32vw",
              height: "32vw",
              minWidth: "260px",
              minHeight: "260px",
              left: "35%",
              top: "25%",
              background: "radial-gradient(circle, rgba(153,69,255,0.2) 0%, rgba(153,69,255,0) 70%)",
            }}
            animate={{
              x: [0, 50, -70, 60, 0],
              y: [0, 70, -50, -40, 0],
              scale: [1, 0.9, 1.1, 1.05, 1],
            }}
            transition={{
              duration: 24,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      )}

      {/* Static Fallback for SSR / prefers-reduced-motion / before mounting */}
      {orbs && !mounted && (
        <div className="absolute inset-0 filter blur-[80px] opacity-70 pointer-events-none">
          <div
            className="absolute rounded-full"
            style={{
              width: "40vw",
              height: "40vw",
              left: "5%",
              top: "-5%",
              background: "radial-gradient(circle, rgba(0,204,177,0.3) 0%, rgba(0,204,177,0) 70%)",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "35vw",
              height: "35vw",
              right: "10%",
              top: "10%",
              background: "radial-gradient(circle, rgba(123,97,255,0.25) 0%, rgba(123,97,255,0) 70%)",
            }}
          />
        </div>
      )}
    </div>
  );
}
