"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTION_TYPES } from "@/lib/question-types";
import type { QuestionType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { PlusIcon } from "@/components/ui/icons";

export function AddQuestionMenu({ onAdd }: { onAdd: (type: QuestionType) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const comingSoonTypes = [
    { label: "Payment/file-upload question types", hint: "Coming soon" },
    { label: "Integrations / webhooks", hint: "Coming soon" },
    { label: "Team collaboration & sharing", hint: "Coming soon" },
    { label: "Real creator authentication", hint: "Default logged-in creator for now" },
  ];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 tf-elevated-card tf-surface-glass border border-border rounded-2xl shadow-lg py-2 max-h-80 overflow-y-auto tf-scrollbar tf-rise-in z-20">
          {QUESTION_TYPES.map(({ type, label, icon: Icon, hint }) => (
            <button
              key={type}
              onClick={() => {
                onAdd(type);
                setOpen(false);
              }}
              className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-surface/80 cursor-pointer transition-colors"
            >
              <Icon width={16} height={16} className="text-ink-soft mt-0.5 shrink-0" />
              <span>
                <span className="block text-sm text-ink font-medium">{label}</span>
                <span className="block text-xs text-ink-soft">{hint}</span>
              </span>
            </button>
          ))}

          <div className="my-2 border-t border-border" />
          <div className="px-4 pb-1 text-[11px] uppercase tracking-wide text-ink-soft font-semibold">Coming soon</div>
          {comingSoonTypes.map((item) => (
            <div
              key={item.label}
              className="w-full flex items-start justify-between gap-3 px-4 py-2.5 text-left opacity-70"
            >
              <span>
                <span className="block text-sm text-ink font-medium">{item.label}</span>
                <span className="block text-xs text-ink-soft">{item.hint}</span>
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-border text-ink-soft">
                Coming soon
              </span>
            </div>
          ))}
        </div>
      )}
      <Button variant="secondary" className="w-full" onClick={() => setOpen((v) => !v)}>
        <PlusIcon width={16} height={16} />
        Add question
      </Button>
    </div>
  );
}
