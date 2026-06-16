"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QuickModeFlow } from "@/components/passport/QuickModeFlow";
import { CustomModeFlow } from "@/components/passport/CustomModeFlow";

type Mode = "quick" | "custom";

function PassportFlow() {
  const [mode, setMode] = useState<Mode>("custom");
  const [hasActiveWork, setHasActiveWork] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  const searchParams = useSearchParams();
  const initialImageUrl = searchParams.get("imageUrl");
  const initialMode = searchParams.get("mode") as Mode | null;
  const jobId = searchParams.get("jobId");
  const itemId = searchParams.get("itemId");

  useEffect(() => {
    if (initialMode && (initialMode === "quick" || initialMode === "custom")) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const handleModeChange = (targetMode: Mode) => {
    if (mode === targetMode) return;
    if (hasActiveWork) {
      setPendingMode(targetMode);
      setShowConfirmModal(true);
    } else {
      setMode(targetMode);
    }
  };

  return (
    <div className="flex flex-col h-full -m-6 relative">
      {/* Top Mode Switcher */}
      <div className="shrink-0 glass-nav px-6 py-3 flex items-center justify-between z-10">
        <div>
          <h1 className="text-h3 font-display font-bold text-foreground">Passport Photo Studio</h1>
          <p className="text-caption text-muted-foreground mt-0.5">
            Auto-remove background and arrange for A4 printing
          </p>
        </div>

        <div className="flex neu-inset p-1 rounded-xl gap-1">
          <button
            onClick={() => handleModeChange("quick")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              mode === "quick"
                ? "glass-strong text-foreground glow-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <i className="bx bx-bolt-circle text-base"></i>
            Quick Mode
          </button>
          <button
            onClick={() => handleModeChange("custom")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              mode === "custom"
                ? "glass-strong text-foreground glow-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <i className="bx bx-slider-alt text-base"></i>
            Custom Mode
          </button>
        </div>
      </div>

      {/* Main Flow Content */}
      <div className="flex-1 min-h-0 relative">
        {mode === "quick" ? (
          <div className="absolute inset-0 bg-background p-6">
            <QuickModeFlow key={`quick-${sessionKey}`} onWorkStatusChange={setHasActiveWork} initialImageUrl={initialImageUrl} jobId={jobId} itemId={itemId} />
          </div>
        ) : (
          <div className="absolute inset-0 bg-background pt-6 px-6">
            <CustomModeFlow key={`custom-${sessionKey}`} onWorkStatusChange={setHasActiveWork} initialImageUrl={initialImageUrl} jobId={jobId} itemId={itemId} />
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md glass-strong glass-rim rounded-clay p-6 elev-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <i className="bx bx-error-alt text-xl" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Discard changes?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You have an active passport photo session.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Switching modes now will discard your current progress, crop adjustments, and enhancements. This action cannot be undone.
            </p>
            
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingMode(null);
                }}
                className="rounded-xl neu px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
              >
                Continue Working
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  if (pendingMode) {
                    setSessionKey(prev => prev + 1);
                    setHasActiveWork(false);
                    setMode(pendingMode);
                  }
                  setPendingMode(null);
                }}
                className="rounded-xl bg-destructive px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-destructive/20 hover:bg-destructive/95 transition"
              >
                Discard &amp; Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PassportPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading passport studio...</div>}>
      <PassportFlow />
    </Suspense>
  );
}
