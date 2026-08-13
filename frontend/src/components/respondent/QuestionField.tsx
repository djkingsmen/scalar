"use client";

import { useEffect, useRef } from "react";
import clsx from "clsx";
import type { Question } from "@/lib/types";
import { StarIcon } from "@/components/ui/icons";

export function QuestionField({
  question,
  value,
  onChange,
  onSubmit,
  autoFocus = true,
}: {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [question.id, autoFocus]);

  // Stops propagation once handled here so the page-level keydown listener (which
  // advances on Enter for non-field questions like multiple choice) doesn't also
  // fire for the same keypress and double-advance.
  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      onSubmit?.();
    }
  };

  switch (question.type) {
    case "short_text":
    case "email":
    case "number":
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={question.type === "number" ? "number" : question.type === "email" ? "email" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleEnter}
          placeholder={question.settings?.placeholder ?? "Type your answer here..."}
          className="tf-underline-input"
          min={question.settings?.min}
          max={question.settings?.max}
        />
      );

    case "long_text":
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              onSubmit?.();
            }
            // Shift+Enter falls through to the browser default (insert a newline).
          }}
          placeholder="Type your answer here... (Shift+Enter for a new line)"
          rows={3}
          className="tf-underline-input resize-none"
        />
      );

    case "multiple_choice":
      return (
        <div className="space-y-2.5">
          {(question.options ?? []).map((opt, i) => {
            const selected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                }}
                className={clsx(
                  "w-full flex items-center gap-3 border rounded-xl px-4 py-3 text-left transition-colors cursor-pointer",
                  selected
                    ? "border-[var(--tf-accent,#0d0d0d)] bg-[color-mix(in_srgb,var(--tf-accent,#0d0d0d)_6%,white)]"
                    : "border-border hover:border-ink-soft"
                )}
              >
                <span
                  className={clsx(
                    "w-7 h-7 shrink-0 rounded-md border flex items-center justify-center text-xs font-semibold",
                    selected
                      ? "border-[var(--tf-accent,#0d0d0d)] bg-[var(--tf-accent,#0d0d0d)] text-white"
                      : "border-border text-ink-soft"
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-base text-ink">{opt.label}</span>
              </button>
            );
          })}
        </div>
      );

    case "dropdown":
      return (
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="tf-underline-input bg-transparent cursor-pointer"
        >
          <option value="" disabled>
            Choose an option
          </option>
          {(question.options ?? []).map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "yes_no":
      return (
        <div className="flex gap-3">
          {[
            { label: "Yes", val: true },
            { label: "No", val: false },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => onChange(o.val)}
              className={clsx(
                "flex-1 border rounded-xl py-4 text-base font-medium transition-colors cursor-pointer",
                value === o.val
                  ? "border-[var(--tf-accent,#0d0d0d)] bg-[var(--tf-accent,#0d0d0d)] text-white"
                  : "border-border text-ink hover:border-ink-soft"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      );

    case "rating": {
      const max = question.settings?.max ?? 5;
      const rating = (value as number) ?? 0;
      return (
        <div className="flex gap-1.5">
          {Array.from({ length: max }).map((_, i) => {
            const filled = i < rating;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(i + 1)}
                className="cursor-pointer text-[var(--tf-accent,#0d0d0d)] hover:scale-110 transition-transform"
                aria-label={`Rate ${i + 1}`}
              >
                <StarIcon
                  width={36}
                  height={36}
                  fill={filled ? "currentColor" : "none"}
                  strokeWidth={filled ? 0 : 1.5}
                />
              </button>
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
}
