"use client";

import type { QuestionOption } from "@/lib/types";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";

export function OptionsEditor({
  options,
  onChange,
}: {
  options: QuestionOption[];
  onChange: (options: QuestionOption[]) => void;
}) {
  const update = (id: string, label: string) =>
    onChange(options.map((o) => (o.id === id ? { ...o, label } : o)));

  const remove = (id: string) => onChange(options.filter((o) => o.id !== id));

  const add = () =>
    onChange([
      ...options,
      { id: `opt_${Math.random().toString(36).slice(2, 8)}`, label: `Option ${options.length + 1}` },
    ]);

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <div key={opt.id} className="flex items-center gap-2">
          <span className="text-xs text-ink-soft w-4">{i + 1}</span>
          <input
            value={opt.label}
            onChange={(e) => update(opt.id, e.target.value)}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
          />
          <button
            onClick={() => remove(opt.id)}
            disabled={options.length <= 2}
            className="text-neutral-300 dark:text-neutral-600 hover:text-danger disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <TrashIcon width={15} height={15} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink font-medium cursor-pointer mt-1"
      >
        <PlusIcon width={14} height={14} />
        Add option
      </button>
    </div>
  );
}
