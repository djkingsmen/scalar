import clsx from "clsx";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "draft";
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border",
        tone === "success" && "bg-emerald-100/70 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
        tone === "draft" && "bg-amber-100/75 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
        tone === "neutral" && "bg-surface text-ink-soft border-border"
      )}
    >
      {tone !== "neutral" && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            tone === "success" && "bg-emerald-500",
            tone === "draft" && "bg-amber-500"
          )}
        />
      )}
      {children}
    </span>
  );
}
