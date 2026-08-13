"use client";

import { motion } from "framer-motion";
import { ArrowRightIcon } from "@/components/ui/icons";

export function WelcomeScreen({
  title,
  description,
  onStart,
}: {
  title: string;
  description?: string | null;
  onStart: () => void;
}) {
  return (
    <motion.div
      className="h-full w-full flex flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-3xl sm:text-5xl font-bold text-ink max-w-2xl leading-tight tracking-tight">
        {title}
      </h1>
      {description && <p className="text-ink-soft text-lg mt-4 max-w-xl">{description}</p>}
      <button
        onClick={onStart}
        className="mt-10 inline-flex items-center gap-2 bg-[var(--tf-accent,#0d0d0d)] text-white px-7 py-3.5 rounded-lg font-medium text-base hover:opacity-90 transition-opacity cursor-pointer"
      >
        Start
        <ArrowRightIcon width={18} height={18} />
      </button>
      <p className="text-xs text-ink-soft mt-4">
        Press <kbd className="px-1.5 py-0.5 border border-border rounded bg-surface font-mono">Enter ↵</kbd>
      </p>
    </motion.div>
  );
}
