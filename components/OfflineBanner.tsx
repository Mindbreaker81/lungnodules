"use client";

import { useEffect, useState } from "react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-20 flex justify-center px-4">
      <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 shadow">
        <span aria-hidden>⚠️</span>
        <span>Sin conexión. Puedes seguir viendo datos en caché; resultados nuevos requieren conexión.</span>
      </div>
    </div>
  );
}
