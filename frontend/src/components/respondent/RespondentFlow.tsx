"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/types";
import { validateAnswer } from "@/lib/validate-answer";
import { WelcomeScreen } from "./WelcomeScreen";
import { ThankYouScreen } from "./ThankYouScreen";
import { ProgressBar } from "./ProgressBar";
import { QuestionField } from "./QuestionField";
import { ArrowRightIcon, ArrowUpIcon } from "@/components/ui/icons";

export interface RespondentFormShape {
  title: string;
  description?: string | null;
  welcome_title?: string | null;
  welcome_description?: string | null;
  thank_you_message?: string | null;
  theme_color?: string | null;
  theme_background?: string | null;
  questions: Question[];
}

export function RespondentFlow({
  form,
  mode,
  onSubmit,
}: {
  form: RespondentFormShape;
  mode: "public" | "preview";
  onSubmit: (answers: { question_id: number; value: unknown }[]) => Promise<void>;
}) {
  const [stage, setStage] = useState<"welcome" | "question" | "thankyou">("welcome");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const questions = form.questions;
  const current = questions[index];
  const accent = form.theme_color || "#0d0d0d";

  const matchesBranch = (answer: unknown, operator: string | undefined, expected: unknown) => {
    const op = operator ?? "eq";
    if (op === "eq") return answer === expected;
    if (op === "neq") return answer !== expected;

    const actualNum = Number(answer);
    const expectedNum = Number(expected);
    if (Number.isNaN(actualNum) || Number.isNaN(expectedNum)) return false;

    if (op === "gt") return actualNum > expectedNum;
    if (op === "gte") return actualNum >= expectedNum;
    if (op === "lt") return actualNum < expectedNum;
    if (op === "lte") return actualNum <= expectedNum;
    return false;
  };

  const getNextIndex = (question: Question, answer: unknown, currentIndex: number) => {
    const branches = question.settings?.logic?.branches ?? [];
    const matched = branches.find((branch) => matchesBranch(answer, branch.operator, branch.match_value));
    if (!matched) return currentIndex + 1;
    if (matched.target_question_id === null) return null;
    const jumpIndex = questions.findIndex((q) => q.id === matched.target_question_id);
    return jumpIndex === -1 ? currentIndex + 1 : jumpIndex;
  };

  const submitAll = async () => {
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ question_id: q.id, value: answers[q.id] ?? null }));
      await onSubmit(payload);
      setStage("thankyou");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong submitting your response.";
      if (current) {
        setErrors((e) => ({ ...e, [current.id]: message }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = async () => {
    if (stage === "welcome") {
      setDirection(1);
      setStage("question");
      return;
    }
    if (!current) return;
    const error = validateAnswer(current, answers[current.id]);
    if (error) {
      setErrors((e) => ({ ...e, [current.id]: error }));
      return;
    }
    setErrors((e) => {
      const next = { ...e };
      delete next[current.id];
      return next;
    });

    const nextIndex = getNextIndex(current, answers[current.id], index);

    if (nextIndex === null || nextIndex >= questions.length) {
      await submitAll();
      return;
    }

    setHistory((prev) => [...prev, index]);
    setDirection(1);
    setIndex(nextIndex);
  };

  const goBack = () => {
    if (stage === "question" && history.length > 0) {
      const previous = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setDirection(-1);
      setIndex(previous);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Text/email/number/long-text fields handle their own Enter (see QuestionField)
      // and stopPropagation so this never double-fires for them. The one case that
      // still reaches here from a textarea is Shift+Enter, which should insert a
      // newline rather than advance.
      if (e.key === "Enter" && target.tagName === "TEXTAREA" && e.shiftKey) {
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        goBack();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (
        stage === "question" &&
        current?.type === "multiple_choice" &&
        /^[a-zA-Z]$/.test(e.key)
      ) {
        const optIndex = e.key.toUpperCase().charCodeAt(0) - 65;
        const opt = current.options?.[optIndex];
        if (opt) setAnswers((a) => ({ ...a, [current.id]: opt.id }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, index, answers, current]);

  const progress =
    stage === "welcome" ? 0 : stage === "thankyou" ? 100 : ((index + 1) / questions.length) * 100;

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, y: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, y: 0 },
    exit: (dir: number) => ({ opacity: 0, y: dir > 0 ? -24 : 24 }),
  };

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen overflow-hidden relative bg-[var(--tf-bg,#ffffff)] flex flex-col"
      style={{ ["--tf-accent" as string]: accent, ["--tf-bg" as string]: form.theme_background || "#ffffff" }}
    >
      <ProgressBar progress={progress} />

      {mode === "preview" && (
        <div className="absolute top-2 right-3 z-40 text-xs bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-medium">
          Preview mode
        </div>
      )}

      <div className="flex-1 relative">
        <AnimatePresence mode="wait" custom={direction}>
          {stage === "welcome" && (
            <motion.div key="welcome" className="absolute inset-0">
              <WelcomeScreen
                title={form.welcome_title || form.title}
                description={form.welcome_description || form.description}
                onStart={goNext}
              />
            </motion.div>
          )}

          {stage === "question" && current && (
            <motion.div
              key={current.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6"
            >
              <div className="w-full max-w-xl">
                <div className="text-sm font-medium mb-3" style={{ color: accent }}>
                  {index + 1} <ArrowRightIcon width={11} height={11} className="inline -mt-0.5" />{" "}
                  <span className="text-ink-soft">{questions.length}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold text-ink mb-1 flex items-start gap-1.5">
                  {current.title}
                  {current.required && <span className="text-danger">*</span>}
                </h2>
                {current.description && (
                  <p className="text-ink-soft mb-6">{current.description}</p>
                )}
                <div className={current.description ? "" : "mt-6"}>
                  <QuestionField
                    question={current}
                    value={answers[current.id]}
                    onChange={(value) => setAnswers((a) => ({ ...a, [current.id]: value }))}
                    onSubmit={goNext}
                  />
                </div>
                {errors[current.id] && (
                  <p className="text-danger text-sm mt-3 tf-fade-in">{errors[current.id]}</p>
                )}
                <div className="flex items-center gap-4 mt-8">
                  <button
                    onClick={goNext}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-medium cursor-pointer disabled:opacity-60 transition-opacity"
                    style={{ background: accent }}
                  >
                    {submitting ? "Submitting..." : "OK"}
                    {!submitting && <ArrowRightIcon width={16} height={16} />}
                  </button>
                  <span className="text-xs text-ink-soft">press Enter ↵</span>
                </div>
              </div>
            </motion.div>
          )}

          {stage === "thankyou" && (
            <motion.div key="thankyou" className="absolute inset-0">
              <ThankYouScreen message={form.thank_you_message || "Thanks for completing this form!"} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {stage === "question" && history.length > 0 && (
        <button
          onClick={goBack}
          className="absolute bottom-6 left-6 w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center text-ink-soft hover:text-ink cursor-pointer shadow-sm"
          aria-label="Previous question"
        >
          <ArrowUpIcon width={16} height={16} />
        </button>
      )}
    </div>
  );
}
