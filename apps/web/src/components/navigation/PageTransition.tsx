"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "motion/react";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.99 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.995,
    transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const sidebarVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    x: 8,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const detailVariants: Variants = {
  initial: { opacity: 0, x: 12 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

function getTransitionVariant(pathname: string): Variants {
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return sidebarVariants;
  }
  if (pathname.startsWith("/dashboard")) {
    return detailVariants;
  }
  return pageVariants;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const variants = getTransitionVariant(pathname);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="contents"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
