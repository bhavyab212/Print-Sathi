"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ProgressBar } from "./ProgressBar";
import { useSound } from "@/hooks/useSound";

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
  const [isNavigating, setIsNavigating] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const pathname = usePathname();
  const { play } = useSound();

  useEffect(() => {
    if (isNavigating) {
      play("navigate-start");
      const timer = setTimeout(() => setShowOverlay(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
      const timer = setTimeout(() => play("navigate-end"), 100);
      return () => clearTimeout(timer);
    }
  }, [isNavigating, play]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  return (
    <NavigationContext.Provider value={{ startNavigation, isNavigating }}>
      <ProgressBar isAnimating={isNavigating} />
      {showOverlay && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-300 animate-fade-in">
          <div className="relative h-28 w-28 animate-[spin_1.2s_linear_infinite]">
            <Image src="/images/logo.png" alt="Loading" fill className="object-contain" />
          </div>
        </div>
      )}
      {children}
    </NavigationContext.Provider>
  );
}
