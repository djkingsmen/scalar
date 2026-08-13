"use client";

import clsx from "clsx";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 cursor-pointer"
    >
      {label && <span className="text-sm text-ink-soft select-none">{label}</span>}
      <span
        className={clsx(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          checked ? "bg-ink" : "bg-border"
        )}
      >
        {/* bg-background inverts with --ink (see Button.tsx) so the knob stays
            visible against the track in both light and dark mode. */}
        <span
          className={clsx(
            "inline-block h-3.5 w-3.5 transform rounded-full transition-transform",
            checked ? "bg-background" : "bg-card",
            checked ? "translate-x-[18px]" : "translate-x-[2px]"
          )}
        />
      </span>
    </button>
  );
}
