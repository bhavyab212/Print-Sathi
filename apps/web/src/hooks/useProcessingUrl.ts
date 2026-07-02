import { useState, useEffect } from "react";

export function useProcessingUrl() {
  const defaultUrl = (process.env.NEXT_PUBLIC_PROCESSING_URL ?? "http://localhost:8000").replace(/\/+$/, "");
  const [url, setUrl] = useState(defaultUrl);

  useEffect(() => {
    const savedUrl = localStorage.getItem("processingUrl");
    if (savedUrl) {
      setUrl(savedUrl);
    }
  }, []);

  const saveUrl = (newUrl: string) => {
    const cleanUrl = newUrl.replace(/\/+$/, "");
    localStorage.setItem("processingUrl", cleanUrl);
    setUrl(cleanUrl);
  };

  return { url, saveUrl };
}
