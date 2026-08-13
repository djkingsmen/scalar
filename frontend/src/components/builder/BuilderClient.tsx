
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import type { FormDetail, Question, QuestionType } from "@/lib/types";
import { emptyQuestionDefaults } from "@/lib/question-types";
import { QuestionList } from "./QuestionList";
import { QuestionEditor } from "./QuestionEditor";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { SettingsModal } from "./SettingsModal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/lib/theme";
import clsx from "clsx";
import { ArrowRightIcon, CheckIcon, EyeIcon, LinkIcon, LoaderIcon, SettingsIcon } from "@/components/ui/icons";

type FormMeta = Pick<
  FormDetail,
  | "title"
  | "description"
  | "welcome_title"
  | "welcome_description"
  | "thank_you_message"
  | "theme_color"
  | "theme_background"
>;

let tempIdCounter = -1;
const nextTempId = () => tempIdCounter--;

function remapBranchTargets(question: Question, idMap: Map<number, number>): Question {
  const branches = question.settings?.logic?.branches;
  if (!branches || branches.length === 0) return question;

  const nextBranches = branches.map((branch) => {
    if (branch.target_question_id === null) return branch;
    return {
      ...branch,
      target_question_id: idMap.get(branch.target_question_id) ?? branch.target_question_id,
    };
  });

  return {
    ...question,
    settings: {
      ...(question.settings ?? {}),
      logic: { branches: nextBranches },
    },
  };
}

function removeBranchTargets(question: Question, deletedId: number): Question {
  const branches = question.settings?.logic?.branches;
  if (!branches || branches.length === 0) return question;

  const nextBranches = branches.filter((branch) => branch.target_question_id !== deletedId);
  return {
    ...question,
    settings: {
      ...(question.settings ?? {}),
      logic: { branches: nextBranches },
    },
  };
}

export function BuilderClient({ formId }: { formId: number }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme } = useTheme();
  const { data, isLoading } = useQuery({ queryKey: ["form", formId], queryFn: () => api.getForm(formId) });

  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [publishing, setPublishing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const loadedRef = useRef(false);
  // Serialized snapshot of what's currently persisted on the server. Used to tell
  // "the user changed something" apart from "our own save just echoed state back",
  // which previously caused an autosave loop (see saveAll below).
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (data && !loadedRef.current) {
      const initialMeta: FormMeta = {
        title: data.title,
        description: data.description,
        welcome_title: data.welcome_title,
        welcome_description: data.welcome_description,
        thank_you_message: data.thank_you_message,
        theme_color: data.theme_color,
        theme_background: data.theme_background,
      };
      setMeta(initialMeta);
      setQuestions(data.questions);
      setStatus(data.status);
      setSelectedId(data.questions[0]?.id ?? null);
      lastSavedRef.current = JSON.stringify({ meta: initialMeta, questions: data.questions });
      loadedRef.current = true;
    }
  }, [data]);

  const saveAll = useMemo(
    () => async (currentMeta: FormMeta, currentQuestions: Question[]) => {
      setSaveState("saving");
      try {
        await api.patchForm(formId, currentMeta);
        const saved = await api.saveQuestions(formId, currentQuestions);

        // Map temp (negative) client-side ids to the real ids the server just assigned,
        // positionally against what we sent. We only ever patch the `id` field on top of
        // whatever is currently in state - never replace the array wholesale - so edits
        // made locally while this request was in flight (new questions, title changes)
        // are never clobbered by this response.
        const idMap = new Map<number, number>();
        currentQuestions.forEach((q, i) => {
          if (q.id < 0 && saved.questions[i]) idMap.set(q.id, saved.questions[i].id);
        });

        if (idMap.size > 0) {
          setQuestions((prev) => {
            if (!prev) return prev;
            return prev.map((q) => {
              const withQuestionId = idMap.has(q.id) ? { ...q, id: idMap.get(q.id)! } : q;
              return remapBranchTargets(withQuestionId, idMap);
            });
          });
          setSelectedId((sid) => (sid !== null && idMap.has(sid) ? idMap.get(sid)! : sid));
        }

        const reconciledQuestions = currentQuestions.map((q) => {
          const withQuestionId = { ...q, id: idMap.get(q.id) ?? q.id };
          return remapBranchTargets(withQuestionId, idMap);
        });
        lastSavedRef.current = JSON.stringify({ meta: currentMeta, questions: reconciledQuestions });
        setSaveState("saved");
      } catch (err) {
        setSaveState("idle");
        toast.error(err instanceof Error ? err.message : "Couldn't save changes");
      }
    },
    [formId]
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!loadedRef.current || !meta || !questions) return;
    const snapshot = JSON.stringify({ meta, questions });
    if (snapshot === lastSavedRef.current) return; // nothing new to save - avoids the autosave-loop
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveAll(meta, questions);
    }, 900);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [meta, questions, saveAll]);

  const updateQuestion = (id: number, patch: Partial<Question>) => {
    setQuestions((prev) => (prev ? prev.map((q) => (q.id === id ? { ...q, ...patch } : q)) : prev));
  };

  const addQuestion = (type: QuestionType) => {
    const id = nextTempId();
    const newQuestion: Question = {
      id,
      type,
      title: "",
      description: null,
      required: false,
      order_index: questions?.length ?? 0,
      ...emptyQuestionDefaults(type),
    };
    setQuestions((prev) => [...(prev ?? []), newQuestion]);
    setSelectedId(id);
  };

  const duplicateQuestion = (id: number) => {
    setQuestions((prev) => {
      if (!prev) return prev;
      const index = prev.findIndex((q) => q.id === id);
      if (index === -1) return prev;
      const original = prev[index];
      const newId = nextTempId();
      const copy: Question = {
        ...original,
        id: newId,
        options: original.options?.map((o) => ({ ...o, id: `opt_${Math.random().toString(36).slice(2, 8)}` })) ?? null,
        settings: original.settings ? { ...original.settings } : null,
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      setSelectedId(newId);
      return next;
    });
  };

  const deleteQuestion = (id: number) => {
    setQuestions((prev) => {
      const next =
        prev
          ?.filter((q) => q.id !== id)
          .map((q) => removeBranchTargets(q, id)) ?? [];
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const handlePublishToggle = async () => {
    if (!meta || !questions) return;
    setPublishing(true);
    try {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      await saveAll(meta, questions);
      const updated = status === "published" ? await api.unpublishForm(formId) : await api.publishForm(formId);
      setStatus(updated.status);
      qc.invalidateQueries({ queryKey: ["forms"] });
      toast.success(updated.status === "published" ? "Form published!" : "Form unpublished");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update publish status");
    } finally {
      setPublishing(false);
    }
  };

  const selectedQuestion = questions?.find((q) => q.id === selectedId) ?? null;
  const selectedIndex = questions?.findIndex((q) => q.id === selectedId) ?? -1;
  const shareUrl = data && typeof window !== "undefined" ? `${window.location.origin}/f/${data.share_slug}` : "";

  if (isLoading || !meta || !questions) {
    return (
      <div
        className={clsx(
          "h-screen flex items-center justify-center text-ink-soft gap-2 bg-page",
          theme === "dark" && "dark"
        )}
      >
        <LoaderIcon width={18} height={18} /> Loading form...
      </div>
    );
  }

  return (
    <div className={clsx("h-screen flex flex-col bg-page tf-theme-transition", theme === "dark" && "dark")}>
      <header className="border-b border-border/80 tf-surface-glass px-5 py-3.5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push("/")}
            className="text-ink-soft hover:text-ink text-sm font-medium cursor-pointer shrink-0"
          >
            ← Forms
          </button>
          <input
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
            className="text-base font-bold tracking-tight text-ink bg-transparent focus:outline-none focus:bg-surface/80 border border-transparent focus:border-border rounded-xl px-2.5 py-1.5 min-w-0 w-64"
          />
          <Badge tone={status === "published" ? "success" : "draft"}>
            {status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-ink-soft flex items-center gap-1 mr-2 w-16">
            {saveState === "saving" && (
              <>
                <LoaderIcon width={12} height={12} /> Saving
              </>
            )}
            {saveState === "saved" && (
              <>
                <CheckIcon width={12} height={12} /> Saved
              </>
            )}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon width={14} height={14} />
            Settings
          </Button>
          <Link href={`/forms/${formId}/results`}>
            <Button variant="secondary" size="sm">
              Results
            </Button>
          </Link>
          <Link href={`/forms/${formId}/preview`} target="_blank">
            <Button variant="secondary" size="sm">
              <EyeIcon width={14} height={14} />
              Preview
            </Button>
          </Link>
          {status === "published" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success("Share link copied");
              }}
            >
              <LinkIcon width={14} height={14} />
              Copy link
            </Button>
          )}
          <Button size="sm" onClick={handlePublishToggle} disabled={publishing}>
            {status === "published" ? "Unpublish" : "Publish"}
            {status !== "published" && <ArrowRightIcon width={14} height={14} />}
          </Button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[280px_1fr_420px] min-h-0 gap-3 p-3">
        <aside className="border border-border/70 bg-panel rounded-3xl min-h-0 tf-elevated-card overflow-hidden">
          <QuestionList
            questions={questions}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onReorder={setQuestions}
            onDelete={deleteQuestion}
            onDuplicate={duplicateQuestion}
            onAdd={addQuestion}
          />
        </aside>

        <main className="overflow-y-auto tf-scrollbar min-h-0 border border-border/70 rounded-3xl bg-card tf-elevated-card">
          {selectedQuestion ? (
            <QuestionEditor
              key={selectedQuestion.id}
              question={selectedQuestion}
              questions={questions}
              onChange={(patch) => updateQuestion(selectedQuestion.id, patch)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-ink-soft text-sm">
              Add a question to get started
            </div>
          )}
        </main>

        <aside className="border border-border/70 p-4 bg-panel rounded-3xl min-h-0 tf-elevated-card">
          <LivePreviewPanel
            question={selectedQuestion}
            index={Math.max(selectedIndex, 0)}
            total={questions.length}
            themeColor={meta.theme_color ?? "#0d0d0d"}
            themeBackground={meta.theme_background ?? "#ffffff"}
          />
        </aside>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        formTitle={meta.title}
        settings={meta}
        onChange={(patch) => setMeta((m) => (m ? { ...m, ...patch } : m))}
      />
    </div>
  );
}
