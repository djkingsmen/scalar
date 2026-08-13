"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "@/components/ui/icons";

export function ThankYouScreen({ message }: { message: string }) {
  return (
    <motion.div
      className="h-full w-full flex flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-14 h-14 rounded-full bg-[var(--tf-accent,#0d0d0d)] flex items-center justify-center mb-6">
        <CheckIcon width={26} height={26} className="text-white" />
      </div>
      <h1 className="text-2xl sm:text-4xl font-bold text-ink max-w-2xl leading-tight tracking-tight">
        {message}
      </h1>
      <p className="text-ink-soft mt-4">You can close this window now.</p>
    </motion.div>
  );
}
