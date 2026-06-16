"use client";

import { useEffect, useState, useCallback } from "react";
import { analytics } from "@lib/analytics";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setWasOffline(true);
    analytics.offlineModeChanged(true);
  }, []);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    analytics.offlineModeChanged(false);
    if (wasOffline) {
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    }
  }, [wasOffline]);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [handleOffline, handleOnline]);

  if (!isOffline && !showReconnected) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 flex justify-center px-4 md:bottom-4">
      {isOffline ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-warning/50 bg-warning/20 px-4 py-2 text-sm text-foreground shadow-lg backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-warning opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-warning"></span>
          </span>
          <span>
            <strong>Sin conexión</strong> — La herramienta funciona offline. Los resultados se calculan localmente.
          </span>
        </div>
      ) : showReconnected ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-success/50 bg-success/20 px-4 py-2 text-sm text-foreground shadow-lg backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="text-success">✓</span>
          <span>Conexión restaurada</span>
        </div>
      ) : null}
    </div>
  );
}
