"use client";

import { useState, useEffect, useRef } from "react";
import { useProcessingUrl } from "@/hooks/useProcessingUrl";

interface HealthInfo {
  status: string;
  total_tasks_processed: number;
  active_model_sessions: string[];
}

export function ConnectionStatusBadge() {
  const { url: processingUrl, saveUrl } = useProcessingUrl();
  const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [healthInfo, setHealthInfo] = useState<HealthInfo | null>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"connect" | "download">("connect");
  const [inputUrl, setInputUrl] = useState(processingUrl);
  
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync inputUrl when processingUrl changes
  useEffect(() => {
    setInputUrl(processingUrl);
  }, [processingUrl]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const checkHealth = async () => {
    setConnectionState("connecting");
    try {
      const res = await fetch(`${processingUrl}/health`);
      if (!res.ok) throw new Error("Offline");
      const data = await res.json();
      setHealthInfo(data);
      setConnectionState("connected");
    } catch {
      setConnectionState("disconnected");
      setHealthInfo(null);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [processingUrl]);

  const dotColor =
    connectionState === "connected" ? "var(--ps-success)" :
    connectionState === "connecting" ? "var(--ps-warning)" : "var(--ps-danger)";
  
  const label =
    connectionState === "connected" ? "AI Connected" :
    connectionState === "connecting" ? "Connecting..." : "AI Offline";

  const handleSaveUrl = () => {
    saveUrl(inputUrl);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="group panel-lift flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-all hover:-translate-y-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <span className="relative flex h-2.5 w-2.5 items-center justify-center">
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
            style={{ background: dotColor }}
          />
          <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: dotColor }} />
        </span>
        <span className="font-semibold text-[11px] font-mono tracking-tight" style={{ color: "var(--ps-ink)" }}>
          {label}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: "var(--ps-ink-muted)" }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-80 panel-lift rounded-2xl p-4 shadow-modal z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Tabs */}
          <div className="flex surface-inner rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab("connect")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${activeTab === "connect" ? "bg-white dark:bg-[#252528] shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Connect
            </button>
            <button
              onClick={() => setActiveTab("download")}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${activeTab === "download" ? "bg-white dark:bg-[#252528] shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Download App
            </button>
          </div>

          {/* Connect Tab */}
          {activeTab === "connect" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Server URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#1a1a1e] border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                  <button 
                    onClick={handleSaveUrl}
                    className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="surface-inner rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">Status</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: dotColor }}>{label}</span>
                </div>
                {connectionState === "connected" && healthInfo && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-border/50 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tasks:</span>
                      <span className="font-mono font-semibold text-gradient">{healthInfo.total_tasks_processed}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">Active Model Sessions:</span>
                      <span className="font-mono text-[10px] truncate rounded-lg px-2 py-1 bg-surface-2 text-primary">
                        {healthInfo.active_model_sessions.join(", ") || "none"}
                      </span>
                    </div>
                  </div>
                )}
                <button 
                  onClick={checkHealth}
                  className="w-full mt-3 bg-surface hover:bg-surface-2 text-foreground border border-border py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Download Tab */}
          {activeTab === "download" && (
            <div className="space-y-3">
              <p className="text-[11px] text-muted-foreground mb-1">
                Install the local AI server to process documents securely on your own machine.
              </p>
              
              {/* Windows Card */}
              <div className="surface-inner hover:border-primary/50 transition-colors rounded-xl p-3 cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#0078D4]/10 rounded-lg text-[#0078D4]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Windows 10/11</h4>
                    <p className="text-[10px] text-muted-foreground">~18 MB Installer</p>
                  </div>
                </div>
                <a 
                  href="https://github.com/bhavyab212/Print-Sathi/releases/latest/download/Print-Sathi-Server-Setup.exe"
                  target="_blank"
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-1.5 rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  Download .exe
                </a>
              </div>

              {/* Linux Card */}
              <div className="bg-[#f8f9fa] dark:bg-[#1e1e21] border border-border/50 rounded-xl p-3 opacity-60 grayscale cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-foreground/10 rounded-lg text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11.968 0C5.352 0 0 5.352 0 11.968s5.352 11.968 11.968 11.968 11.968-5.352 11.968-11.968S18.584 0 11.968 0zm-2.079 17.591c-1.83 0-3.313-1.483-3.313-3.313 0-1.83 1.483-3.313 3.313-3.313 1.83 0 3.313 1.483 3.313 3.313 0 1.83-1.483 3.313-3.313 3.313zm4.158-7.9c-1.83 0-3.313-1.483-3.313-3.313 0-1.83 1.483-3.313 3.313-3.313 1.83 0 3.313 1.483 3.313 3.313 0 1.83-1.483 3.313-3.313 3.313z"/></svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground">Linux</h4>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-surface px-1.5 py-0.5 rounded text-muted-foreground">Coming Soon</span>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
