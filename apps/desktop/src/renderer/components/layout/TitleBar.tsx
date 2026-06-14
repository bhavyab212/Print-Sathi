import React, { useState, useEffect } from 'react';

const PROCESSING_URL =
  (import.meta as any).env?.VITE_PROCESSING_URL ?? "http://localhost:8000";

export function TitleBar() {
  const handleMinimize = () => window.electron.minimize();
  const handleMaximize = () => window.electron.maximize();
  const handleClose = () => window.electron.close();

  // Health/Connection status states
  const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [healthInfo, setHealthInfo] = useState<{
    status: string;
    total_tasks_processed: number;
    active_model_sessions: string[];
  } | null>(null);

  // Poll server health
  useEffect(() => {
    let active = true;
    const checkHealth = async () => {
      try {
        const res = await fetch(`${PROCESSING_URL}/health`);
        if (!res.ok) throw new Error("Offline");
        const data = await res.json();
        if (active) {
          setHealthInfo(data);
          setConnectionState("connected");
        }
      } catch (err) {
        if (active) {
          setConnectionState("disconnected");
          setHealthInfo(null);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      className="flex h-10 w-full shrink-0 select-none items-center justify-between border-b border-gray-200 bg-white"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 pl-4">
        <i className="bx bx-printer text-blue-600"></i>
        <span className="text-sm font-medium text-gray-700">Print Sathi</span>
      </div>

      <div 
        className="flex h-full items-center gap-4"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Connection Status Indicator */}
        <div className="relative group flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-2.5 py-0.5 text-xs transition-colors hover:bg-gray-100 cursor-default">
          <span className={`h-1.5 w-1.5 rounded-full ${
            connectionState === "connected" ? "bg-green-500 animate-pulse" :
            connectionState === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500 animate-pulse"
          }`} />
          <span className="font-semibold text-gray-600 text-[10px] uppercase tracking-wider">
            {connectionState === "connected" ? "AI Connected" :
             connectionState === "connecting" ? "Connecting..." : "AI Offline"}
          </span>

          {/* Details Tooltip Card */}
          <div className="absolute right-0 top-full mt-1.5 z-50 hidden group-hover:block w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-xl text-left select-text">
            <p className="text-[9px] uppercase font-bold text-gray-400 mb-1.5 tracking-wider">Server Status Details</p>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-400">Endpoint:</span>
                <span className="font-mono font-medium text-[10px] text-gray-500 truncate max-w-[130px]" title={PROCESSING_URL}>
                  {PROCESSING_URL}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connection:</span>
                <span className={`font-semibold capitalize ${
                  connectionState === "connected" ? "text-green-600" :
                  connectionState === "connecting" ? "text-yellow-600" : "text-red-600"
                }`}>
                  {connectionState}
                </span>
              </div>
              {connectionState === "connected" && healthInfo && (
                <>
                  <div className="flex justify-between border-t border-gray-100 pt-1.5 mt-1.5">
                    <span className="text-gray-400">Tasks Processed:</span>
                    <span className="font-mono font-semibold">{healthInfo.total_tasks_processed}</span>
                  </div>
                  <div className="flex flex-col border-t border-gray-100 pt-1.5">
                    <span className="text-gray-400">Active Model Sessions:</span>
                    <span className="font-mono text-[9px] mt-1 truncate bg-gray-50 px-1.5 py-0.5 rounded text-blue-600">
                      {healthInfo.active_model_sessions.join(", ") || "none"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex h-full">
          <button 
            onClick={handleMinimize}
            className="flex h-full w-12 items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <i className="bx bx-minus"></i>
          </button>
          <button 
            onClick={handleMaximize}
            className="flex h-full w-12 items-center justify-center text-gray-500 hover:bg-gray-100"
          >
            <i className="bx bx-window"></i>
          </button>
          <button 
            onClick={handleClose}
            className="flex h-full w-12 items-center justify-center text-gray-500 hover:bg-red-500 hover:text-white"
          >
            <i className="bx bx-x text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

