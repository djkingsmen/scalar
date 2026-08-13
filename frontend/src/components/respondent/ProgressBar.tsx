export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-neutral-100 z-40">
      <div
        className="h-full bg-[var(--tf-accent,#0d0d0d)] transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}
