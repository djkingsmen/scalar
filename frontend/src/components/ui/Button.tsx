"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// `text-background` (rather than a hardcoded text-white) is intentional: --ink and
// --background are inverses of each other in both themes, so pairing them keeps
// the primary/outline buttons legible whether --ink resolves to near-black (light
// mode) or near-white (dark mode) without needing separate dark: overrides.
const variantClasses: Record<Variant, string> = {
  primary:
    "text-white border border-transparent bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent)_88%,#ffb783)_0%,color-mix(in_srgb,var(--accent)_96%,#8a2f11)_100%)] shadow-[0_8px_18px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:-translate-y-0.5 hover:shadow-[0_12px_24px_color-mix(in_srgb,var(--accent)_38%,transparent)] disabled:opacity-50",
  secondary:
    "tf-elevated-card text-ink hover:bg-surface/80 hover:-translate-y-0.5",
  outline:
    "bg-transparent text-ink border border-border hover:border-ink hover:bg-card/80",
  ghost: "bg-transparent text-ink hover:bg-surface/70",
  danger:
    "text-white border border-transparent bg-[linear-gradient(145deg,#d94a40_0%,#b72821_100%)] shadow-[0_8px_18px_rgba(176,35,28,0.3)] hover:-translate-y-0.5 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 rounded-xl gap-1.5",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2",
  lg: "text-base px-6 py-3 rounded-2xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
