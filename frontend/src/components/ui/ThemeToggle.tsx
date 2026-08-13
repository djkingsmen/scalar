"use client";

import type { Theme } from "@/lib/theme";
import { MoonIcon, SunIcon } from "./icons";

export function ThemeToggle({
  theme,
  onToggle,
  mounted,
}: {
  theme: Theme;
  onToggle: () => void;
  mounted: boolean;
}) {
  if (!mounted) return <div className="w-9 h-9 shrink-0" aria-hidden />;

  return (
    <button
      onClick={onToggle}
      className="w-10 h-10 shrink-0 rounded-2xl border border-border bg-card/70 flex items-center justify-center text-ink-soft hover:text-ink hover:bg-surface cursor-pointer transition-all hover:-translate-y-0.5"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <SunIcon width={17} height={17} /> : <MoonIcon width={17} height={17} />}
    </button>
  );
}
