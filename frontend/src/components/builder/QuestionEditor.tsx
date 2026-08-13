"use client";

import type { LogicBranch, Question, QuestionType } from "@/lib/types";
import { QUESTION_TYPES, emptyQuestionDefaults, questionTypeMeta } from "@/lib/question-types";
import { OptionsEditor } from "./OptionsEditor";
import { Toggle } from "@/components/ui/Toggle";

export function QuestionEditor({
  question,
  questions,
  onChange,
}: {
  question: Question;
  questions: Question[];
  onChange: (patch: Partial<Question>) => void;
}) {
  const meta = questionTypeMeta(question.type);
  const supportsLogic =
    question.type === "multiple_choice" ||
    question.type === "dropdown" ||
    question.type === "yes_no" ||
    question.type === "number" ||
    question.type === "rating";
  const supportsComparatorLogic = question.type === "number" || question.type === "rating";
  const currentIndex = questions.findIndex((q) => q.id === question.id);
  const jumpTargets = questions.filter((q, i) => q.id !== question.id && i > currentIndex);

  const choiceValues: { value: string | boolean; label: string }[] =
    question.type === "yes_no"
      ? [
          { value: true, label: "Yes" },
          { value: false, label: "No" },
        ]
      : (question.options ?? []).map((opt) => ({ value: opt.id, label: opt.label }));

  const logicBranches = question.settings?.logic?.branches ?? [];

  const comparatorOps = [
    { value: "eq", label: "is equal to" },
    { value: "neq", label: "is not equal to" },
    { value: "gt", label: "is greater than" },
    { value: "gte", label: "is greater than or equal to" },
    { value: "lt", label: "is less than" },
    { value: "lte", label: "is less than or equal to" },
  ] as const;

  const updateBranches = (branches: LogicBranch[]) => {
    onChange({
      settings: {
        ...(question.settings ?? {}),
        logic: { branches },
      },
    });
  };

  const setBranchTarget = (matchValue: string | boolean, selection: string) => {
    const withoutCurrent = logicBranches.filter((b) => b.match_value !== matchValue);
    if (selection === "next") {
      updateBranches(withoutCurrent);
      return;
    }
    if (selection === "end") {
      updateBranches([...withoutCurrent, { match_value: matchValue, target_question_id: null }]);
      return;
    }
    const targetId = Number(selection.replace("jump:", ""));
    if (!Number.isNaN(targetId)) {
      updateBranches([...withoutCurrent, { match_value: matchValue, target_question_id: targetId }]);
    }
  };

  const updateComparatorRule = (index: number, patch: Partial<LogicBranch>) => {
    const nextBranches = logicBranches.map((branch, i) => (i === index ? { ...branch, ...patch } : branch));
    updateBranches(nextBranches);
  };

  const addComparatorRule = () => {
    updateBranches([
      ...logicBranches,
      {
        operator: "gte",
        match_value: question.type === "rating" ? 4 : 0,
        target_question_id: null,
      },
    ]);
  };

  const removeComparatorRule = (index: number) => {
    updateBranches(logicBranches.filter((_, i) => i !== index));
  };

  const changeType = (type: QuestionType) => {
    onChange({ type, ...emptyQuestionDefaults(type) });
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-6 tf-fade-in">
      <div className="mb-6">
        <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">Question type</label>
        <div className="relative mt-1.5">
          <select
            value={question.type}
            onChange={(e) => changeType(e.target.value as QuestionType)}
            className="w-full appearance-none border border-border rounded-lg px-3.5 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink cursor-pointer"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-ink-soft mt-1">{meta.hint}</p>
      </div>

      <div className="mb-5">
        <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">Question</label>
        <textarea
          value={question.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Type your question here"
          rows={2}
          className="w-full mt-1.5 border border-border rounded-lg px-3.5 py-2.5 text-base font-medium resize-none focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
        />
      </div>

      <div className="mb-5">
        <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">
          Description <span className="normal-case font-normal">(optional)</span>
        </label>
        <textarea
          value={question.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Add helper text shown below the question"
          rows={2}
          className="w-full mt-1.5 border border-border rounded-lg px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
        />
      </div>

      {(question.type === "multiple_choice" || question.type === "dropdown") && (
        <div className="mb-5">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-1.5 block">
            Options
          </label>
          <OptionsEditor
            options={question.options ?? []}
            onChange={(options) => onChange({ options })}
          />
        </div>
      )}

      {question.type === "rating" && (
        <div className="mb-5">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">Max rating</label>
          <select
            value={question.settings?.max ?? 5}
            onChange={(e) => onChange({ settings: { ...question.settings, max: Number(e.target.value) } })}
            className="mt-1.5 border border-border rounded-lg px-3.5 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink cursor-pointer"
          >
            {[3, 5, 7, 10].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
        </div>
      )}

      {question.type === "number" && (
        <div className="mb-5 flex gap-4">
          <div>
            <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">Min</label>
            <input
              type="number"
              value={question.settings?.min ?? ""}
              onChange={(e) =>
                onChange({
                  settings: { ...question.settings, min: e.target.value === "" ? undefined : Number(e.target.value) },
                })
              }
              className="mt-1.5 w-28 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-soft uppercase tracking-wide">Max</label>
            <input
              type="number"
              value={question.settings?.max ?? ""}
              onChange={(e) =>
                onChange({
                  settings: { ...question.settings, max: e.target.value === "" ? undefined : Number(e.target.value) },
                })
              }
              className="mt-1.5 w-28 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
            />
          </div>
        </div>
      )}

      {supportsLogic && !supportsComparatorLogic && (
        <div className="mb-5 border border-border rounded-xl p-4 bg-panel/30">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2 block">
            Logic jumps / conditional branching
          </label>
          <p className="text-xs text-ink-soft mb-3">
            Choose where each answer should go. If no rule is set, the form continues to the next question.
          </p>
          <div className="space-y-3">
            {choiceValues.map((choice) => {
              const rule = logicBranches.find((b) => b.match_value === choice.value);
              const selected =
                rule === undefined
                  ? "next"
                  : rule.target_question_id === null
                    ? "end"
                    : `jump:${rule.target_question_id}`;
              return (
                <div key={String(choice.value)} className="grid grid-cols-[1fr_1fr] gap-2 items-center">
                  <span className="text-sm text-ink">If answer is {choice.label}</span>
                  <select
                    value={selected}
                    onChange={(e) => setBranchTarget(choice.value, e.target.value)}
                    className="w-full appearance-none border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink cursor-pointer"
                  >
                    <option value="next">Go to next question</option>
                    {jumpTargets.map((target) => (
                      <option key={target.id} value={`jump:${target.id}`}>
                        Jump to: {target.title.trim() || "Untitled question"}
                      </option>
                    ))}
                    <option value="end">End form (thank-you screen)</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {supportsComparatorLogic && (
        <div className="mb-5 border border-border rounded-xl p-4 bg-panel/30">
          <label className="text-xs font-medium text-ink-soft uppercase tracking-wide mb-2 block">
            Logic jumps / conditional branching
          </label>
          <p className="text-xs text-ink-soft mb-3">
            {`Add rules like "if rating is greater than or equal to 4" to jump to another question or end the form.`}
          </p>

          <div className="space-y-3">
            {logicBranches.map((rule, idx) => {
              const selectedTarget =
                rule.target_question_id === null ? "end" : `jump:${rule.target_question_id}`;
              return (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <select
                    value={rule.operator ?? "eq"}
                    onChange={(e) =>
                      updateComparatorRule(idx, {
                        operator: e.target.value as "eq" | "neq" | "gt" | "gte" | "lt" | "lte",
                      })
                    }
                    className="w-full appearance-none border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink cursor-pointer"
                  >
                    {comparatorOps.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={typeof rule.match_value === "number" ? rule.match_value : 0}
                    onChange={(e) =>
                      updateComparatorRule(idx, {
                        match_value: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
                  />

                  <select
                    value={selectedTarget}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "end") {
                        updateComparatorRule(idx, { target_question_id: null });
                        return;
                      }
                      const targetId = Number(value.replace("jump:", ""));
                      if (!Number.isNaN(targetId)) {
                        updateComparatorRule(idx, { target_question_id: targetId });
                      }
                    }}
                    className="w-full appearance-none border border-border rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink cursor-pointer"
                  >
                    {jumpTargets.map((target) => (
                      <option key={target.id} value={`jump:${target.id}`}>
                        Jump to: {target.title.trim() || "Untitled question"}
                      </option>
                    ))}
                    <option value="end">End form (thank-you screen)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => removeComparatorRule(idx)}
                    className="px-3 py-2 text-xs rounded-lg border border-border text-ink-soft hover:text-ink cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addComparatorRule}
            className="mt-3 px-3 py-2 text-sm rounded-lg border border-border text-ink hover:border-ink-soft cursor-pointer"
          >
            Add condition
          </button>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
        <span className="text-sm text-ink font-medium">Required question</span>
        <Toggle checked={question.required} onChange={(required) => onChange({ required })} />
      </div>
    </div>
  );
}
