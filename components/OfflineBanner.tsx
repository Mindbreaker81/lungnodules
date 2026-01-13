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
          className="flex items-center gap-2 rounded-lg border border-amber-900/50 bg-amber-900/20 px-4 py-2 text-sm text-amber-200 shadow-lg backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
          </span>
          <span>
            <strong>Sin conexión</strong> — La herramienta funciona offline. Los resultados se calculan localmente.
          </span>
        </div>
      ) : showReconnected ? (
        <div
          className="flex items-center gap-2 rounded-lg border border-green-900/50 bg-green-900/20 px-4 py-2 text-sm text-green-200 shadow-lg backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <span className="text-green-500">✓</span>
          <span>Conexión restaurada</span>
        </div>
      ) : null}
    </div>
  );
}
