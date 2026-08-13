"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { FormListItem, FormStatus } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import { FormCard } from "@/components/dashboard/FormCard";
import { Button } from "@/components/ui/Button";
import { PromptModal } from "@/components/ui/PromptModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PlusIcon, SearchIcon, SparkleIcon, XIcon } from "@/components/ui/icons";

type SortKey = "updated" | "responses" | "title";
type StatusFilter = "all" | FormStatus;

export default function DashboardPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, toggle, mounted } = useTheme();
  const { data: forms, isLoading } = useQuery({ queryKey: ["forms"], queryFn: api.listForms });

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FormListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["forms"] });

  const createMutation = useMutation({
    mutationFn: (title: string) => api.createForm(title),
    onSuccess: (form) => {
      toast.success("Form created");
      invalidate();
      router.push(`/forms/${form.id}/edit`);
    },
    onError: () => toast.error("Couldn't create the form"),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => api.patchForm(id, { title }),
    onSuccess: () => {
      toast.success("Form renamed");
      invalidate();
    },
    onError: () => toast.error("Couldn't rename the form"),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => api.duplicateForm(id),
    onSuccess: () => {
      toast.success("Form duplicated");
      invalidate();
    },
    onError: () => toast.error("Couldn't duplicate the form"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteForm(id),
    onSuccess: () => {
      toast.success("Form deleted");
      invalidate();
    },
    onError: () => toast.error("Couldn't delete the form"),
  });

  const publishMutation = useMutation({
    mutationFn: (form: FormListItem) =>
      form.status === "published" ? api.unpublishForm(form.id) : api.publishForm(form.id),
    onSuccess: (updated) => {
      toast.success(updated.status === "published" ? "Form published" : "Form unpublished");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message || "Couldn't update the form"),
  });

  const visibleForms = useMemo(() => {
    if (!forms) return [];
    const query = search.trim().toLowerCase();
    let result = forms.filter((f) => {
      const matchesSearch = !query || f.title.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    result = [...result].sort((a, b) => {
      if (sortKey === "responses") return b.response_count - a.response_count;
      if (sortKey === "title") return a.title.localeCompare(b.title);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [forms, search, statusFilter, sortKey]);

  const hasAnyForms = !!forms && forms.length > 0;
  const hasFiltersActive = search.trim() !== "" || statusFilter !== "all";

  return (
    <div className={clsx("min-h-screen bg-page tf-theme-transition", theme === "dark" && "dark")}>
      <header className="sticky top-0 z-20 border-b border-border/80 tf-surface-glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[linear-gradient(145deg,var(--accent),#f2a061)] text-white shadow-[0_10px_20px_color-mix(in_srgb,var(--accent)_35%,transparent)] flex items-center justify-center shrink-0">
              <SparkleIcon width={18} height={18} className="text-card" />
            </div>
            <span className="font-bold text-xl tracking-tight text-ink">Typeform</span>
            <span className="ml-2 text-xs text-ink-soft border border-border bg-card/70 rounded-full px-2.5 py-1">
              Signed in as Demo Creator
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} onToggle={toggle} mounted={mounted} />
            <div className="flex items-center gap-1 bg-surface rounded-xl p-1 w-fit border border-border/70">
              <button
                onClick={() => setCreateOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer capitalize transition-colors bg-card text-ink shadow-sm flex items-center gap-1.5"
              >
                <PlusIcon width={14} height={14} />
                Create a form
              </button>
              <button
                onClick={() => toast("Coming soon: Integrations / webhooks")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer capitalize transition-colors text-ink-soft hover:text-ink"
              >
                Integrations
              </button>
              <button
                onClick={() => toast("Coming soon: Team collaboration & sharing")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer capitalize transition-colors text-ink-soft hover:text-ink"
              >
                Team
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8 tf-elevated-card rounded-3xl p-7 sm:p-9 relative overflow-hidden">
          <div className="absolute -top-16 -right-20 w-64 h-64 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--accent)_24%,transparent)_0%,transparent_68%)]" />
          <div className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,#35a39b_22%,transparent)_0%,transparent_68%)]" />
          <div className="relative">
            <h1 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight">Your forms</h1>
            <p className="text-ink-soft mt-2 max-w-2xl">Build, publish, and track responses in one place.</p>
          </div>
        </div>

        {hasAnyForms && (
          <div className="tf-elevated-card rounded-2xl p-3.5 sm:p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <SearchIcon
                width={15}
                height={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search forms..."
                className="w-full border border-border bg-card/80 rounded-xl pl-9 pr-8 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink cursor-pointer"
                  aria-label="Clear search"
                >
                  <XIcon width={13} height={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 bg-surface rounded-xl p-1 w-fit border border-border/70">
              {(["all", "draft", "published"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer capitalize transition-colors",
                    statusFilter === s ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="border border-border bg-card/80 rounded-xl px-3.5 py-2.5 text-sm text-ink cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink sm:ml-auto"
            >
              <option value="updated">Last updated</option>
              <option value="responses">Most responses</option>
              <option value="title">Title A-Z</option>
            </select>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && !hasAnyForms && (
          <div className="text-center py-24 border border-dashed border-border rounded-3xl tf-elevated-card">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4 border border-border/70">
              <SparkleIcon width={20} height={20} className="text-ink-soft" />
            </div>
            <p className="text-ink-soft mb-4">You haven&apos;t created any forms yet.</p>
            <Button onClick={() => setCreateOpen(true)}>
              <PlusIcon width={16} height={16} />
              Create your first form
            </Button>
          </div>
        )}

        {!isLoading && hasAnyForms && visibleForms.length === 0 && (
          <div className="text-center py-24 border border-dashed border-border rounded-3xl tf-elevated-card">
            <p className="text-ink-soft mb-4">No forms match your search.</p>
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        {!isLoading && visibleForms.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleForms.map((form, i) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
              >
                <FormCard
                  form={form}
                  onRename={() => setRenameTarget(form)}
                  onDuplicate={() => duplicateMutation.mutate(form.id)}
                  onDelete={() => setDeleteTarget(form)}
                  onTogglePublish={() => publishMutation.mutate(form)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {hasFiltersActive && visibleForms.length > 0 && (
          <p className="text-xs text-ink-soft mt-6">
            Showing {visibleForms.length} of {forms?.length} forms
          </p>
        )}
      </main>

      <PromptModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(title) => createMutation.mutate(title)}
        title="Create a new form"
        label="Form title"
        placeholder="Untitled form"
        submitLabel="Create"
      />

      <PromptModal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        onSubmit={(title) => renameTarget && renameMutation.mutate({ id: renameTarget.id, title })}
        title="Rename form"
        label="Form title"
        initialValue={renameTarget?.title ?? ""}
        submitLabel="Save"
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete form"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently remove the form and all of its responses.`}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
