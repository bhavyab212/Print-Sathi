import { useState, useEffect } from "react";

const CANDIDATE_URLS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000",
  "http://0.0.0.0:8000"
];

export function useProcessingUrl() {
  const defaultUrl = (process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://127.0.0.1:8000").replace(/\/+$/, "");
  const [url, setUrl] = useState(defaultUrl);

  useEffect(() => {
    const savedUrl = localStorage.getItem("processingUrl");
    if (savedUrl) {
      setUrl(savedUrl);
    } else {
      // Auto-detect on first load if no saved URL
      autoDetectUrl();
    }
  }, []);

  const saveUrl = (newUrl: string) => {
    const cleanUrl = newUrl.replace(/\/+$/, "");
    localStorage.setItem("processingUrl", cleanUrl);
    setUrl(cleanUrl);
  };

  const autoDetectUrl = async () => {
    for (const candidate of CANDIDATE_URLS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(`${candidate}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          saveUrl(candidate);
          return candidate;
        }
      } catch (e) {
        // Skip on error or timeout
      }
    }
    return null;
  };

  return { url, saveUrl, autoDetectUrl };
}
