"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { api } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuestionSummaryCard } from "./QuestionSummaryCard";
import { ResponsesTable } from "./ResponsesTable";
import { ResponseDetailModal } from "./ResponseDetailModal";
import { BarChartIcon, CheckIcon, DownloadIcon, LinkIcon, LoaderIcon } from "@/components/ui/icons";
import { toast } from "sonner";

export function ResultsClient({ formId }: { formId: number }) {
  const [selectedResponse, setSelectedResponse] = useState<number | null>(null);
  const { theme } = useTheme();

  const { data: form, isLoading: loadingForm } = useQuery({
    queryKey: ["form", formId],
    queryFn: () => api.getForm(formId),
  });
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["summary", formId],
    queryFn: () => api.getSummary(formId),
  });
  const { data: responses, isLoading: loadingResponses } = useQuery({
    queryKey: ["responses", formId],
    queryFn: () => api.listResponses(formId),
  });

  if (loadingForm || loadingSummary || loadingResponses || !form || !summary || !responses) {
    return (
      <div className={clsx("h-screen flex items-center justify-center text-ink-soft gap-2 bg-page", theme === "dark" && "dark")}>
        <LoaderIcon width={18} height={18} /> Loading results...
      </div>
    );
  }

  const accent = form.theme_color || "#0d0d0d";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/f/${form.share_slug}` : "";
  const partial = summary.total_responses - summary.completed_responses;

  return (
    <div className={clsx("min-h-screen bg-page tf-theme-transition", theme === "dark" && "dark")}>
      <header className="border-b border-border bg-card px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-ink-soft hover:text-ink text-sm shrink-0">
            ← Forms
          </Link>
          <h1 className="text-base font-semibold text-ink truncate">{form.title}</h1>
          <Badge tone={form.status === "published" ? "success" : "draft"}>
            {form.status === "published" ? "Published" : "Draft"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/forms/${formId}/edit`}>
            <Button variant="secondary" size="sm">
              Edit form
            </Button>
          </Link>
          {form.status === "published" && (
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
          <a href={api.exportCsvUrl(formId)} download>
            <Button size="sm">
              <DownloadIcon width={14} height={14} />
              Export CSV
            </Button>
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatTile icon={BarChartIcon} label="Total responses" value={summary.total_responses} />
          <StatTile icon={CheckIcon} label="Completed" value={summary.completed_responses} />
          <StatTile
            label="Completion rate"
            value={`${Math.round(summary.completion_rate * 100)}%`}
            bar={{ completed: summary.completed_responses, partial, accent }}
          />
        </div>

        <h2 className="text-lg font-semibold text-ink mb-4">Summary</h2>
        {summary.questions.length === 0 ? (
          <p className="text-sm text-ink-soft border border-dashed border-border rounded-2xl bg-card py-10 text-center mb-10">
            Add questions to this form to see summary stats here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            {summary.questions.map((q) => (
              <QuestionSummaryCard key={q.question_id} summary={q} accent={accent} />
            ))}
          </div>
        )}

        <h2 className="text-lg font-semibold text-ink mb-4">
          Responses <span className="text-ink-soft font-normal">({responses.length})</span>
        </h2>
        <ResponsesTable responses={responses} onSelect={setSelectedResponse} />
      </main>

      <ResponseDetailModal
        formId={formId}
        responseId={selectedResponse}
        questions={form.questions}
        onClose={() => setSelectedResponse(null)}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  bar,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  bar?: { completed: number; partial: number; accent: string };
}) {
  const total = bar ? bar.completed + bar.partial : 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon width={13} height={13} className="text-ink-soft" />}
        <p className="text-xs font-medium text-ink-soft uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold text-ink tabular-nums">{value}</p>

      {bar && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-surface overflow-y-auto flex">
            {total > 0 && (
              <div
                className="h-full rounded-full"
                style={{ width: `${(bar.completed / total) * 100}%`, background: bar.accent }}
              />
            )}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: bar.accent }} />
              {bar.completed} completed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
              {bar.partial} partial
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
