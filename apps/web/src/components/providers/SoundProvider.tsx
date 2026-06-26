"use client";

import { createContext, useCallback, useState, useEffect } from "react";
import { soundEngine } from "@/lib/sound-system";

interface SoundContextValue {
  muted: boolean;
  setMuted: (muted: boolean) => void;
}

export const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMutedState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ps-sound-muted") === "true";
    }
    return false;
  });

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    soundEngine.setMuted(m);
  }, []);

  useEffect(() => {
    soundEngine.setMuted(muted);
  }, [muted]);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Expose mute/sound controls globally
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "m" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        setMuted(!muted);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [muted, setMuted]);

  return (
    <SoundContext.Provider value={{ muted, setMuted }}>
      {reducedMotion ? (
        <meta name="reduced-motion" content="true" />
      ) : null}
      {children}
    </SoundContext.Provider>
  );
}
