import { useState, useEffect } from "react";
import { useProcessingUrl } from "./useProcessingUrl";

let globalIsOnline = false;
const listeners = new Set<(online: boolean) => void>();

let pollInterval: any = null;

function startPolling(url: string) {
  if (pollInterval) clearInterval(pollInterval);
  
  const check = async () => {
    try {
      const res = await fetch(`${url}/health`, { method: "GET" });
      const online = res.ok;
      if (online !== globalIsOnline) {
        globalIsOnline = online;
        listeners.forEach(l => l(online));
      }
    } catch (err) {
      if (globalIsOnline !== false) {
        globalIsOnline = false;
        listeners.forEach(l => l(false));
      }
    }
  };
  
  check();
  pollInterval = setInterval(check, 5000);
}

export function useServerHealth() {
  const { url } = useProcessingUrl();
  const [isOnline, setIsOnline] = useState<boolean>(globalIsOnline);

  useEffect(() => {
    listeners.add(setIsOnline);
    if (!pollInterval || url) {
      startPolling(url);
    }
    return () => {
      listeners.delete(setIsOnline);
    };
  }, [url]);

  return isOnline;
}
