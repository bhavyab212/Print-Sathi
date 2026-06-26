"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { ProgressBar } from "./ProgressBar";
import { useSound } from "@/hooks/useSound";
import { LoadingOverlay, MIN_LOADING_MS } from "@/components/ui/LoadingOverlay";

interface NavigationContextValue {
  startNavigation: () => void;
  isNavigating: boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigationLoading() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigationLoading must be used within NavigationProvider");
  }
  return ctx;
}

export function useNavigationLoadingOptional() {
  return useContext(NavigationContext);
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const navigationStartedAt = useRef(Date.now());
  const pathname = usePathname();
  const { play } = useSound();

  useEffect(() => {
    if (isNavigating) {
      play("navigate-start");
      setShowOverlay(true);
    } else {
      const elapsed = Date.now() - navigationStartedAt.current;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      const timer = setTimeout(() => {
        setShowOverlay(false);
        play("navigate-end");
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, play]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = useCallback(() => {
    navigationStartedAt.current = Date.now();
    setIsNavigating(true);
  }, []);

  return (
    <NavigationContext.Provider value={{ startNavigation, isNavigating }}>
      <ProgressBar isAnimating={isNavigating} />
      {showOverlay && <LoadingOverlay className="animate-fade-in bg-black/45 backdrop-blur-md" />}
      {children}
    </NavigationContext.Provider>
  );
}
