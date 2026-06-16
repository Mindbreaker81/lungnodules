"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@components/ui/button";
import { useEffect, useState } from "react";

const themes = [
  { id: "light", label: "Claro", icon: Sun },
  { id: "dark", label: "Oscuro", icon: Moon },
  { id: "system", label: "Sistema", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center rounded-md border border-border bg-background p-1">
        {themes.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={t.label}
              disabled
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center rounded-md border border-border bg-background p-1">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;
        return (
          <Button
            key={t.id}
            type="button"
            variant={isActive ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(t.id)}
            aria-label={t.label}
            aria-pressed={isActive}
            title={t.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
