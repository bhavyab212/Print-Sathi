// Shared motion variants + springs (seeded from motion-dev guidance).
// Used by showpiece surfaces (landing, dashboard shell). Reduced-motion aware
// at the CSS level (.reveal / prefers-reduced-motion in globals.css) and here
// via the `transition` springs that respect user settings when wrapped.

import type { Variants, Transition } from "motion/react";

export const spring: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.9,
};

export const springSoft: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 1,
};

// Section / hero entrance
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: spring },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: spring },
};

// Stagger container — children use fadeUp/scaleIn
export const stagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

// Premium hover lift for cards/buttons
export const hoverLift = {
  whileHover: { y: -3, transition: spring },
  whileTap: { scale: 0.98 },
};
