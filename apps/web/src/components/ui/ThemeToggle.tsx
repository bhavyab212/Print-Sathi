"use client";

import { useEffect, useState } from "react";
import { Boxicon } from "@/components/ui/Boxicon";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  return (
    <button
      onClick={toggle}
      className="glass glass-rim flex h-9 w-9 items-center justify-center rounded-xl text-[var(--ps-ink-muted)] transition-all hover:text-[var(--ps-ink)]"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <Boxicon className="bx bx-sun text-lg" />
      ) : (
        <Boxicon className="bx bx-moon text-lg" />
      )}
    </button>
  );
}
