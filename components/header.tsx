"use client";

import Link from "next/link";
import { ThemeToggle } from "@components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between px-4 lg:max-w-4xl">
        <Link
          href="/"
          className="text-lg font-bold text-foreground transition-colors hover:text-primary"
          aria-label="Inicio"
        >
          Lung Nodule Tracker
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
