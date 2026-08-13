"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Question } from "@/lib/types";
import { questionTypeMeta } from "@/lib/question-types";
import { CopyIcon, GripIcon, TrashIcon } from "@/components/ui/icons";

export function QuestionListItem({
  question,
  index,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  question: Question;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });
  const meta = questionTypeMeta(question.type);
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={clsx(
        "group flex items-center gap-2 rounded-xl px-2.5 py-2.5 cursor-pointer border transition-all",
        selected ? "tf-elevated-card border-border" : "border-transparent hover:bg-card/70",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-neutral-300 dark:text-neutral-600 hover:text-ink-soft cursor-grab active:cursor-grabbing shrink-0"
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder"
      >
        <GripIcon width={16} height={16} />
      </button>
      <span className="text-xs text-ink-soft w-4 shrink-0">{index + 1}</span>
      <Icon width={15} height={15} className="text-ink-soft shrink-0" />
      <span className="text-sm text-ink truncate flex-1">{question.title || "Untitled question"}</span>
      {question.required && <span className="text-danger text-xs shrink-0">*</span>}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        className="opacity-0 group-hover:opacity-100 text-neutral-300 dark:text-neutral-600 hover:text-ink-soft shrink-0 cursor-pointer"
        aria-label="Duplicate question"
        title="Duplicate question"
      >
        <CopyIcon width={13} height={13} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-neutral-300 dark:text-neutral-600 hover:text-danger shrink-0 cursor-pointer"
        aria-label="Delete question"
      >
        <TrashIcon width={14} height={14} />
      </button>
    </div>
  );
}
