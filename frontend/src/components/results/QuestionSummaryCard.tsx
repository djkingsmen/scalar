import type { QuestionSummary } from "@/lib/types";
import { questionTypeMeta } from "@/lib/question-types";

export function QuestionSummaryCard({ summary, accent }: { summary: QuestionSummary; accent: string }) {
  const meta = questionTypeMeta(summary.type);
  const Icon = meta.icon;
  const maxCount = summary.counts ? Math.max(...Object.values(summary.counts), 1) : 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon width={15} height={15} className="text-ink-soft shrink-0" />
        <h3 className="text-sm font-semibold text-ink flex-1 truncate">{summary.title}</h3>
        <span className="text-xs text-ink-soft shrink-0">{summary.response_count} answers</span>
      </div>

      {summary.counts && Object.keys(summary.counts).length > 0 && (
        <div className="space-y-2.5">
          {Object.entries(summary.counts)
            .sort((a, b) => b[1] - a[1])
            .map(([label, count]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm text-ink truncate pr-2">{label}</span>
                  <span className="text-xs text-ink-soft tabular-nums shrink-0">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%`, background: accent }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}

      {summary.average !== null && summary.average !== undefined && (
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-ink tabular-nums">{summary.average}</span>
          <span className="text-sm text-ink-soft">average</span>
        </div>
      )}

      {summary.sample_answers && (
        <div className="space-y-2">
          {summary.sample_answers.length === 0 && (
            <p className="text-sm text-ink-soft italic">No answers yet</p>
          )}
          {summary.sample_answers.map((a, i) => (
            <p key={i} className="text-sm text-ink-soft bg-surface rounded-lg px-3 py-2 line-clamp-2">
              &ldquo;{a}&rdquo;
            </p>
          ))}
        </div>
      )}

      {summary.response_count === 0 && !summary.sample_answers && (
        <p className="text-sm text-ink-soft italic">No answers yet</p>
      )}
    </div>
  );
}
