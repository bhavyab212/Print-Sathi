import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";

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
  const location = useLocation();

  useEffect(() => {
    setIsNavigating(false);
  }, [location.pathname]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  return (
    <NavigationContext.Provider value={{ startNavigation, isNavigating }}>
      {children}
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md transition-all duration-300">
          <div className="flex flex-col items-center gap-4">
            <i className="bx bx-loader-alt animate-spin text-5xl text-blue-500" />
            <p className="text-sm font-medium text-white/90">Loading...</p>
          </div>
        </div>
      )}
    </NavigationContext.Provider>
  );
}
