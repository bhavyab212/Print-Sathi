"use client";

import { NavigationProvider } from "@/components/navigation/NavigationProvider";
import { SoundProvider } from "@/components/providers/SoundProvider";
import { PageTransition } from "@/components/navigation/PageTransition";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SoundProvider>
      <NavigationProvider>
        <PageTransition>
          {children}
        </PageTransition>
      </NavigationProvider>
    </SoundProvider>
  );
}
