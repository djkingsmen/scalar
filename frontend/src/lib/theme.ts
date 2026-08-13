"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "formix-theme";

export type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getSnapshot(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  return stored ?? getSystemTheme();
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const emptySubscribe = () => () => {};

/**
 * Dark mode for the creator-facing app shell (dashboard/builder/results) only.
 * The public respondent flow deliberately never reads this - it renders with
 * each form's own theme_color/theme_background regardless of the creator's
 * app preference.
 *
 * Reads localStorage via useSyncExternalStore (not useState+useEffect) so the
 * client-only read never desyncs from what React thinks was rendered - the
 * first client render intentionally matches getServerSnapshot ("light") to
 * avoid a hydration mismatch; `mounted` tells consumers when the real value
 * has taken over, so a toggle icon can hide itself for that one frame instead
 * of flashing the wrong icon.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const toggle = useCallback(() => {
    const next: Theme = getSnapshot() === "dark" ? "light" : "dark";
    localStorage.setItem(STORAGE_KEY, next);
    // The native `storage` event only fires in *other* tabs; dispatch it manually
    // here so this tab's useSyncExternalStore subscribers re-read immediately.
    window.dispatchEvent(new Event("storage"));
  }, []);

  return { theme, toggle, mounted };
}
