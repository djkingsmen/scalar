"use client";

import { useState } from "react";
import type { Question } from "@/lib/types";
import { QuestionField } from "@/components/respondent/QuestionField";
import { ArrowRightIcon } from "@/components/ui/icons";

export function LivePreviewPanel({
  question,
  index,
  total,
  themeColor,
  themeBackground,
}: {
  question: Question | null;
  index: number;
  total: number;
  themeColor: string;
  themeBackground?: string;
}) {
  const [value, setValue] = useState<unknown>(null);

  // This panel mimics the public respondent screen, which always renders with the
  // form's own light/dark theme_background - never the creator's app-wide dark
  // mode preference. Re-pin the shared design tokens to their light values here so
  // text stays legible if this panel happens to be nested under a `.dark` ancestor.
  const previewTokens = {
    ["--tf-accent" as string]: themeColor,
    ["--ink" as string]: "#191919",
    ["--ink-soft" as string]: "#4a4a4a",
    ["--border" as string]: "#e6e6e4",
    ["--surface" as string]: "#f8f8f6",
    ["--danger" as string]: "#dc2626",
    colorScheme: "light" as const,
  };

  if (!question) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-ink-soft" style={previewTokens}>
        Select a question to preview it
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col rounded-2xl border border-border overflow-hidden"
      style={{ ...previewTokens, background: themeBackground || "#ffffff" }}
    >
      <div className="h-1 bg-neutral-100">
        <div
          className="h-full transition-all"
          style={{ width: `${((index + 1) / Math.max(total, 1)) * 100}%`, background: themeColor }}
        />
      </div>
      <div
        className="flex-1 flex flex-col justify-center px-8 py-10 overflow-y-auto tf-scrollbar tf-fade-in"
        key={question.id}
      >
        <div className="text-xs font-medium text-ink-soft mb-3">
          {index + 1} <ArrowRightIcon width={10} height={10} className="inline -mt-0.5" /> {total}
        </div>
        <h3 className="text-xl font-semibold text-ink mb-1 flex items-start gap-1">
          {question.title || "Untitled question"}
          {question.required && <span className="text-danger">*</span>}
        </h3>
        {question.description && <p className="text-sm text-ink-soft mb-5">{question.description}</p>}
        <div className={question.description ? "" : "mt-5"}>
          <QuestionField question={question} value={value} onChange={setValue} autoFocus={false} />
        </div>
      </div>
      <div className="px-8 py-3 border-t border-border text-xs text-ink-soft">Live preview - not saved</div>
    </div>
  );
}
