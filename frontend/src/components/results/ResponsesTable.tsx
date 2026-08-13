import type { ResponseListItem } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ResponsesTable({
  responses,
  onSelect,
}: {
  responses: ResponseListItem[];
  onSelect: (id: number) => void;
}) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-16 text-ink-soft border border-dashed border-border rounded-2xl bg-card">
        No responses yet. Share your form to start collecting answers.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-ink-soft">
            <th className="px-5 py-3 font-medium">#</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Answers</th>
            <th className="px-5 py-3 font-medium">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => (
            <tr
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="border-b border-border last:border-0 hover:bg-surface cursor-pointer"
            >
              <td className="px-5 py-3 text-ink-soft">#{r.id}</td>
              <td className="px-5 py-3">
                <Badge tone={r.completed ? "success" : "draft"}>{r.completed ? "Complete" : "Partial"}</Badge>
              </td>
              <td className="px-5 py-3 text-ink">{r.answer_count}</td>
              <td className="px-5 py-3 text-ink-soft">
                {r.submitted_at ? formatDate(r.submitted_at) : formatDate(r.started_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
